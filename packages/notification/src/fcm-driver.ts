import { type FcmAdminMessaging, FcmSendError } from "#src/fcm-types";

export interface FcmPayload {
  notificationId: number;
  title: string;
  body: string;
  actionUrl: string;
}

export interface FcmDispatchResult {
  success: boolean;
  status: "dispatched" | "failed" | "invalid";
  providerMessageId?: string;
  error?: string;
  terminal?: boolean;
}

/**
 * Phân loại lỗi theo `browser-push.md` §4.2 / `BR-BPS-12`. Chỉ nhìn `httpStatus` và
 * `fcmErrorCode` của `FcmSendError` — không đọc nội dung nào có thể chứa token (`BR-BPS-13`).
 */
export function classifyFcmError(error: Error | string | object | null): {
  status: "invalid" | "failed";
  terminal: boolean;
  label: string;
} {
  if (error instanceof FcmSendError) {
    const { httpStatus, fcmErrorCode } = error;
    const label = `HTTP ${httpStatus} ${fcmErrorCode}`;
    if (
      (httpStatus === 404 && fcmErrorCode === "UNREGISTERED") ||
      (httpStatus === 400 && fcmErrorCode === "INVALID_ARGUMENT")
    ) {
      return { status: "invalid", terminal: true, label };
    }
    const retryable =
      httpStatus === 429 || httpStatus === 401 || httpStatus >= 500;
    return { status: "failed", terminal: !retryable, label };
  }
  // Lỗi mạng / không xác định: coi là tạm thời, không in message (có thể chứa URL).
  return { status: "failed", terminal: false, label: "NETWORK_OR_UNKNOWN" };
}

/**
 * Dispatches an FCM push notification using the FCM messaging interface.
 * Enforces BR-BPS-05: payload strictly excludes child PII.
 */
export async function sendFcmWebPush(
  messaging: FcmAdminMessaging,
  token: string,
  payload: FcmPayload
): Promise<FcmDispatchResult> {
  const safeTitle = payload.title || "MindKid";
  const safeBody = payload.body || "";
  const safeActionUrl = payload.actionUrl || "/me";

  try {
    const messageId = await messaging.send({
      token,
      notification: {
        title: safeTitle,
        body: safeBody,
      },
      data: {
        notification_id: String(payload.notificationId),
        action_url: safeActionUrl,
      },
    });

    return {
      success: true,
      status: "dispatched",
      providerMessageId: messageId,
    };
  } catch (err) {
    const classified = classifyFcmError(err instanceof Error ? err : null);
    return {
      success: false,
      status: classified.status,
      error: classified.label,
      terminal: classified.terminal,
    };
  }
}
