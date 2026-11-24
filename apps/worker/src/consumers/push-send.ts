import {
  NOTIFICATION_CHANNEL,
  NOTIFICATION_STATUS,
  NotificationsRepository,
} from "@mindkid/db";
import {
  createFcmHttpV1Messaging,
  dispatchFcmWebPush,
  resolveFcmConfig,
} from "@mindkid/notification";
import { readErrorMessage } from "#src/errors";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

/**
 * `browser-push.md` §4.1. Idempotent bằng trạng thái delivery bền (`BR-JOB-01`):
 * delivery đã `dispatched` thì không gửi lại. Lỗi tạm thời được ném để queue retry
 * (`BR-BPS-12`); log và `last_error` chỉ chứa nhãn lỗi, không bao giờ token/khoá (`BR-BPS-13`).
 */
export const pushSend: Consumer<"push:send"> = async (payload, ctx) => {
  const repo = new NotificationsRepository();
  if (
    await repo.isDeliveryDispatched(
      payload.notificationId,
      NOTIFICATION_CHANNEL.FCM_WEB
    )
  ) {
    logJobDone("push:send", ctx, {
      notificationId: payload.notificationId,
      status: "already_dispatched",
    });
    return { status: "suppressed", suppressedReason: "ALREADY_DISPATCHED" };
  }

  const resolution = resolveFcmConfig(process.env);
  if (!resolution.configured) {
    console.warn(
      `[push:send] FCM not configured, channel disabled; missing: ${resolution.missing.join(",")}`
    );
  }
  const messaging = resolution.configured
    ? createFcmHttpV1Messaging(resolution.config)
    : undefined;

  try {
    const outcome = await dispatchFcmWebPush(payload, messaging);
    logJobDone("push:send", ctx, {
      notificationId: payload.notificationId,
      status: outcome.status,
      dispatched: outcome.dispatchedCount,
      invalidated: outcome.invalidatedCount,
    });
    return outcome;
  } catch (error) {
    await repo.recordDeliveryOutcome(payload.notificationId, {
      channel: NOTIFICATION_CHANNEL.FCM_WEB,
      status: NOTIFICATION_STATUS.FAILED,
      error: readErrorMessage(error),
    });
    throw error;
  }
};
