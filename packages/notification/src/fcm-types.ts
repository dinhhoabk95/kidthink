export interface FcmAdminMessaging {
  send(message: {
    token: string;
    notification?: { title?: string; body?: string };
    data?: Record<string, string>;
  }): Promise<string>;
}

/**
 * Lỗi từ FCM / OAuth2. Chỉ mang HTTP status và mã lỗi FCM — Cấm chứa token thiết bị,
 * access token, JWT hay khoá riêng (`BR-BPS-13`).
 */
export class FcmSendError extends Error {
  readonly httpStatus: number;
  readonly fcmErrorCode: string;

  constructor(httpStatus: number, fcmErrorCode: string) {
    super(`FCM send failed: HTTP ${httpStatus} ${fcmErrorCode}`);
    this.name = "FcmSendError";
    this.httpStatus = httpStatus;
    this.fcmErrorCode = fcmErrorCode;
  }
}
