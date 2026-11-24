import {
  type JsonRecord,
  type JsonValue,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_STATUS,
  NotificationsRepository,
  RECIPIENT_TYPE_CODEC,
} from "@mindkid/db";
import { alert, enqueue } from "@mindkid/queue";

function readErrorMessage(
  error: Error | string | object | null | undefined
): string {
  return error instanceof Error ? error.message : String(error);
}

export type NotificationPayloadValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly string[]
  | readonly number[]
  | Record<string, string | number | boolean | null | undefined>;

export interface TransactionalEmailInput {
  recipientType: "user" | "manager";
  recipientId: number;
  /** Mã trong `NOTIFICATION_TYPES` — xem `notification-service.md` §7.1. */
  code: string;
  to: string;
  payload: Record<string, NotificationPayloadValue>;
  /**
   * Bí mật dùng một lần (raw token, URL chứa token) chỉ đẩy sang job `email:send`,
   * Cấm — NEVER lưu vào cột `notifications.payload` bền trong DB (`BR-EVF-01`, `#289` S1).
   */
  secrets?: Readonly<Record<string, string>>;
}

function toJsonPayloadValue(
  value: NotificationPayloadValue
): JsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => item);
  }
  const nested: Record<string, JsonValue | undefined> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v !== undefined) {
      nested[k] = v;
    }
  }
  return nested;
}

function toNotificationPayloadRecord(
  payload: Record<string, NotificationPayloadValue>
): JsonRecord {
  const normalized: Record<string, JsonValue | undefined> = {};
  for (const [key, val] of Object.entries(payload)) {
    const mapped = toJsonPayloadValue(val);
    if (mapped !== undefined) {
      normalized[key] = mapped;
    }
  }
  return normalized;
}

/**
 * Đường duy nhất để một route đẩy email giao dịch.
 */
export async function dispatchTransactionalEmail(
  input: TransactionalEmailInput
): Promise<{ notificationId: number }> {
  const notificationsRepo = new NotificationsRepository();
  const { notification } = await notificationsRepo.createWithEmailDelivery({
    recipientType: RECIPIENT_TYPE_CODEC.toCode(input.recipientType),
    recipientId: input.recipientId,
    templateCode: input.code,
    payload: toNotificationPayloadRecord(input.payload),
  });
  const notificationId = notification.id;

  const jobPayload: Record<string, NotificationPayloadValue> = input.secrets
    ? { ...input.payload, ...input.secrets }
    : { ...input.payload };

  try {
    await enqueue("email:send", {
      notificationId,
      to: input.to,
      code: input.code,
      payload: jobPayload,
    });
  } catch (error) {
    const message = readErrorMessage(
      error instanceof Error ? error : String(error)
    );

    await recordEmailDeliveryOutcome(notificationId, {
      status: "failed",
      error: message,
    });
    await alert("error", "Không đẩy được email giao dịch vào hàng đợi", {
      notificationId,
      code: input.code,
      error: message,
    });

    throw error;
  }

  return { notificationId };
}

export interface EmailDeliveryOutcome {
  status: "dispatched" | "suppressed" | "failed";
  providerMessageId?: string;
  suppressedReason?: string;
  error?: string;
}

function encodeOutcomeStatus(
  status: EmailDeliveryOutcome["status"]
):
  | typeof NOTIFICATION_STATUS.DISPATCHED
  | typeof NOTIFICATION_STATUS.SUPPRESSED
  | typeof NOTIFICATION_STATUS.FAILED {
  switch (status) {
    case "dispatched":
      return NOTIFICATION_STATUS.DISPATCHED;
    case "suppressed":
      return NOTIFICATION_STATUS.SUPPRESSED;
    default:
      return NOTIFICATION_STATUS.FAILED;
  }
}

/**
 * `BR-JOB-01` — consumer phải idempotent thật.
 */
export async function isEmailAlreadyDispatched(
  notificationId: number
): Promise<boolean> {
  const notificationsRepo = new NotificationsRepository();
  return await notificationsRepo.isDeliveryDispatched(
    notificationId,
    NOTIFICATION_CHANNEL.EMAIL
  );
}

export async function recordEmailDeliveryOutcome(
  notificationId: number,
  outcome: EmailDeliveryOutcome
): Promise<void> {
  const notificationsRepo = new NotificationsRepository();
  await notificationsRepo.recordDeliveryOutcome(notificationId, {
    channel: NOTIFICATION_CHANNEL.EMAIL,
    status: encodeOutcomeStatus(outcome.status),
    providerMessageId: outcome.providerMessageId ?? null,
    suppressedReason: outcome.suppressedReason ?? null,
    error: outcome.error ?? null,
  });
}
