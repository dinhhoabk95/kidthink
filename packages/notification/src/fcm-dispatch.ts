import {
  NOTIFICATION_CHANNEL,
  NOTIFICATION_STATUS,
  NotificationsRepository,
} from "@mindkid/db";
import { decryptFcmToken } from "#src/fcm-crypto";
import { type FcmPayload, sendFcmWebPush } from "#src/fcm-driver";
import type { FcmServiceAccountConfig } from "#src/fcm-http-client";
import type { FcmAdminMessaging } from "#src/fcm-types";

export interface FcmEnvSource {
  readonly FCM_PROJECT_ID?: string;
  readonly FCM_CLIENT_EMAIL?: string;
  readonly FCM_PRIVATE_KEY?: string;
}

export type FcmConfigResolution =
  | { readonly configured: true; readonly config: FcmServiceAccountConfig }
  | { readonly configured: false; readonly missing: readonly string[] };

/**
 * `BR-BPS-11` — thiếu bất kỳ biến nào thì kênh tắt. Chỉ trả về **tên** biến thiếu,
 * không bao giờ trả giá trị (`BR-BPS-13`).
 */
export function resolveFcmConfig(
  env: FcmEnvSource,
  fetchFn?: typeof fetch
): FcmConfigResolution {
  const projectId = env.FCM_PROJECT_ID?.trim();
  const clientEmail = env.FCM_CLIENT_EMAIL?.trim();
  const privateKeyPem = env.FCM_PRIVATE_KEY?.trim();
  const missing: string[] = [];
  if (!projectId) {
    missing.push("FCM_PROJECT_ID");
  }
  if (!clientEmail) {
    missing.push("FCM_CLIENT_EMAIL");
  }
  if (!privateKeyPem) {
    missing.push("FCM_PRIVATE_KEY");
  }
  if (!(projectId && clientEmail && privateKeyPem)) {
    return { configured: false, missing };
  }
  return {
    configured: true,
    config: {
      projectId,
      clientEmail,
      privateKeyPem,
      ...(fetchFn ? { fetchFn } : {}),
    },
  };
}

export interface PushSendInput extends FcmPayload {
  readonly userId: number;
}

export interface PushSendOutcome {
  readonly status: "dispatched" | "suppressed" | "failed";
  readonly suppressedReason?: string;
  readonly dispatchedCount: number;
  readonly invalidatedCount: number;
}

/** Ném khi mọi endpoint đều không gửi được và có lỗi tạm thời — queue sẽ retry (`BR-BPS-12`). */
export class FcmRetryableError extends Error {
  constructor(label: string) {
    super(`FCM push retryable failure: ${label}`);
    this.name = "FcmRetryableError";
  }
}

/**
 * Gửi push tới mọi endpoint `active` của User rồi ghi delivery `fcm_web`.
 * `messaging` là `undefined` khi chưa cấu hình → `suppressed` (`BR-BPS-11`).
 */
export async function dispatchFcmWebPush(
  input: PushSendInput,
  messaging: FcmAdminMessaging | undefined
): Promise<PushSendOutcome> {
  const repo = new NotificationsRepository();
  const record = async (
    outcome: Parameters<NotificationsRepository["recordDeliveryOutcome"]>[1]
  ) => {
    await repo.recordDeliveryOutcome(input.notificationId, {
      channel: NOTIFICATION_CHANNEL.FCM_WEB,
      ...outcome,
    });
  };

  if (!messaging) {
    await record({
      status: NOTIFICATION_STATUS.SUPPRESSED,
      suppressedReason: "FCM_NOT_CONFIGURED",
    });
    return {
      status: "suppressed",
      suppressedReason: "FCM_NOT_CONFIGURED",
      dispatchedCount: 0,
      invalidatedCount: 0,
    };
  }

  const endpoints = await repo.listActiveEndpointsForDispatch(input.userId);
  if (endpoints.length === 0) {
    await record({
      status: NOTIFICATION_STATUS.SUPPRESSED,
      suppressedReason: "NO_ACTIVE_ENDPOINT",
    });
    return {
      status: "suppressed",
      suppressedReason: "NO_ACTIVE_ENDPOINT",
      dispatchedCount: 0,
      invalidatedCount: 0,
    };
  }

  let dispatchedCount = 0;
  let invalidatedCount = 0;
  let providerMessageId: string | undefined;
  let retryableLabel: string | undefined;
  let lastLabel = "";

  for (const endpoint of endpoints) {
    const token = decryptFcmToken(endpoint.tokenEncrypted);
    const result = await sendFcmWebPush(messaging, token, input);
    if (result.success) {
      dispatchedCount += 1;
      providerMessageId ??= result.providerMessageId;
      continue;
    }
    lastLabel = result.error ?? "UNKNOWN";
    if (result.status === "invalid") {
      await repo.markEndpointInvalid(endpoint.id);
      invalidatedCount += 1;
    } else if (!result.terminal) {
      retryableLabel = lastLabel;
    }
  }

  if (dispatchedCount > 0) {
    await record({
      status: NOTIFICATION_STATUS.DISPATCHED,
      providerMessageId: providerMessageId ?? null,
    });
    return { status: "dispatched", dispatchedCount, invalidatedCount };
  }

  if (retryableLabel !== undefined) {
    // Chưa ghi `failed` terminal: queue retry; hết retry thì dead-letter alert (BR-JOB-05).
    throw new FcmRetryableError(retryableLabel);
  }

  await record({ status: NOTIFICATION_STATUS.FAILED, error: lastLabel });
  return { status: "failed", dispatchedCount, invalidatedCount };
}
