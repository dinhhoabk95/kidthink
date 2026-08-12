export const AUTH_ERROR_DEFINITIONS = {
  UNAUTHENTICATED: {
    status: 401,
    message: "Bạn cần đăng nhập để tiếp tục.",
  },
  INSUFFICIENT_ROLE: {
    status: 403,
    message: "Bạn không có quyền truy cập mục này.",
  },
  CSRF_INVALID: {
    status: 403,
    message: "Phiên bảo mật không hợp lệ. Vui lòng tải lại trang và thử lại.",
  },
  NO_ACTIVE_CHILD: {
    status: 428,
    message: "Hãy chọn hồ sơ bé trước khi tiếp tục.",
  },
  NOT_FOUND: {
    status: 404,
    message: "Không tìm thấy nội dung.",
  },
  SESSION_REVOKED: {
    status: 401,
    message: "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.",
  },
  REAUTH_REQUIRED: {
    status: 428,
    message: "Vui lòng xác minh lại danh tính để tiếp tục.",
  },
  VALIDATION_FAILED: {
    status: 422,
    message: "Dữ liệu yêu cầu không hợp lệ.",
  },
  EMAIL_ALREADY_REGISTERED: {
    status: 409,
    message: "Email này đã được đăng ký tài khoản.",
  },
  INVALID_CREDENTIALS: {
    status: 401,
    message: "Email hoặc mật khẩu không chính xác.",
  },
  ACCOUNT_SUSPENDED: {
    status: 403,
    message: "Tài khoản đang tạm khoá. Liên hệ hỗ trợ.",
  },
  ACCOUNT_DELETED: {
    status: 403,
    message: "Tài khoản của bạn đang trong thời gian chờ xoá.",
  },
  RATE_LIMITED: {
    status: 429,
    message: "Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít phút.",
  },
  TOKEN_EXPIRED: {
    status: 410,
    message: "Mã xác thực đã hết hạn hoặc không còn hiệu lực.",
  },
  RESTRICTED_MODE: {
    status: 403,
    message: "Vui lòng xác thực email để thực hiện thao tác này.",
  },
  CONSENT_REQUIRED: {
    status: 428,
    message: "Vui lòng đọc và đồng ý chính sách bảo vệ dữ liệu trẻ em.",
  },
  TIER_LOCKED: {
    status: 403,
    message: "Nội dung này thuộc gói cao hơn.",
  },
  DAILY_PLAY_CAP_REACHED: {
    status: 402,
    message: "Đã đạt giới hạn thời gian chơi trong ngày.",
  },
  SESSION_ALREADY_COMPLETED: {
    status: 409,
    message: "Phiên chơi đã hoàn thành.",
  },
  SESSION_EXPIRED: {
    status: 410,
    message: "Phiên chơi đã hết hạn.",
  },
  EVENT_OUT_OF_ORDER: {
    status: 409,
    message: "Thứ tự sự kiện không hợp lệ.",
  },
  UNKNOWN_EVENT_NAME: {
    status: 422,
    message: "Tên sự kiện không hợp lệ.",
  },
  BATCH_TOO_LARGE: {
    status: 413,
    message: "Kích thước lô sự kiện vượt quá giới hạn.",
  },
  PAYLOAD_TOO_LARGE: {
    status: 413,
    message: "Dữ liệu sự kiện vượt quá giới hạn.",
  },
  INVALID_SEQUENCE: {
    status: 400,
    message: "Mã thứ tự sự kiện không hợp lệ.",
  },
  SESSION_NOT_FOUND: {
    status: 404,
    message: "Không tìm thấy phiên chơi.",
  },
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_DEFINITIONS;
export type AuthErrorDetails = Readonly<Record<string, unknown>>;

export interface AuthErrorResponse {
  readonly code: AuthErrorCode;
  readonly message: string;
  readonly details?: AuthErrorDetails;
}

export class AppError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;
  readonly details?: AuthErrorDetails;

  constructor(code: AuthErrorCode, details?: AuthErrorDetails) {
    const definition = AUTH_ERROR_DEFINITIONS[code];
    super(definition?.message ?? "Đã xảy ra lỗi.");
    this.name = "AppError";
    this.code = code;
    this.status = definition?.status ?? 500;
    this.details = details;
  }

  toResponse(): AuthErrorResponse {
    const response: AuthErrorResponse = {
      code: this.code,
      message: this.message,
    };

    if (this.details) {
      return { ...response, details: this.details };
    }

    return response;
  }
}

export function appError(
  code: AuthErrorCode,
  details?: AuthErrorDetails
): AppError {
  return new AppError(code, details);
}
