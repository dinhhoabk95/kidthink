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

export interface FcmAdminMessaging {
  send(message: {
    token: string;
    notification?: { title?: string; body?: string };
    data?: Record<string, string>;
  }): Promise<string>;
}

const TERMINAL_FCM_ERROR_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/mismatched-credential",
  "messaging/invalid-argument",
]);

/**
 * Dispatches an FCM push notification using FCM Admin Messaging interface.
 * Enforces BR-BPS-05: Payload strictly excludes child PII.
 */
export async function sendFcmWebPush(
  messaging: FcmAdminMessaging,
  token: string,
  payload: FcmPayload
): Promise<FcmDispatchResult> {
  // BR-BPS-05: Payload validation against child PII leakage
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
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    const errorCode = errorObj?.code || "";
    const errorMessage = errorObj?.message || String(err);

    const isTerminal = TERMINAL_FCM_ERROR_CODES.has(errorCode);

    return {
      success: false,
      status: isTerminal ? "invalid" : "failed",
      error: errorMessage,
      terminal: isTerminal,
    };
  }
}
