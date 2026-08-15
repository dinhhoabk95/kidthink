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
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: "Hệ thống tạm thời không khả dụng. Vui lòng thử lại sau.",
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
  CONTENT_ARCHIVED: {
    status: 410,
    message: "Nội dung này đã ngừng phát hành.",
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
  PARENT_GATE_INVALID: {
    status: 400,
    message: "Thử thách phụ huynh không hợp lệ.",
  },
  PARENT_GATE_EXPIRED: {
    status: 410,
    message: "Thử thách phụ huynh đã hết hạn.",
  },
  PARENT_GATE_FAILED: {
    status: 403,
    message: "Câu trả lời thử thách phụ huynh không chính xác.",
  },
  SOCIAL_EMAIL_CONFLICT: {
    status: 409,
    message:
      "Email này đã được sử dụng bởi tài khoản khác. Vui lòng đăng nhập bằng mật khẩu.",
  },
  SOCIAL_IDENTITY_ALREADY_LINKED: {
    status: 409,
    message: "Tài khoản mạng xã hội này đã được liên kết với người dùng khác.",
  },
  SOCIAL_PROVIDER_ALREADY_LINKED: {
    status: 409,
    message: "Bạn đã liên kết với nhà cung cấp mạng xã hội này rồi.",
  },
  LAST_LOGIN_METHOD: {
    status: 409,
    message:
      "Không thể huỷ liên kết vì đây là phương thức đăng nhập duy nhất của tài khoản.",
  },
  OAUTH_PROVIDER_DISABLED: {
    status: 404,
    message: "Nhà cung cấp đăng nhập này hiện chưa khả dụng.",
  },
  OAUTH_STATE_INVALID: {
    status: 400,
    message: "Phiên xác thực mạng xã hội không hợp lệ hoặc đã hết hạn.",
  },
  OAUTH_PROVIDER_ERROR: {
    status: 502,
    message: "Lỗi kết nối từ nhà cung cấp đăng nhập mạng xã hội.",
  },
  CONSENT_REQUIREMENT_CHANGED: {
    status: 409,
    message: "Yêu cầu đồng ý vừa được cập nhật. Vui lòng xem lại.",
  },
  PASSWORD_NOT_SET: {
    status: 409,
    message: "Tài khoản chưa có mật khẩu. Hãy dùng Đặt mật khẩu.",
  },
  PASSWORD_ALREADY_SET: {
    status: 409,
    message: "Tài khoản đã có mật khẩu. Hãy dùng Đổi mật khẩu.",
  },
  TRANSACTIONAL_NOTIFICATION_CANNOT_BE_DISABLED: {
    status: 422,
    message: "Thông báo giao dịch là bắt buộc và không thể tắt.",
  },
  ACCOUNT_PURGED: {
    status: 410,
    message: "Tài khoản đã bị xoá vĩnh viễn và không thể khôi phục.",
  },
  EMAIL_ALREADY_IN_USE: {
    status: 409,
    message: "Địa chỉ email này đã được sử dụng bởi một tài khoản khác.",
  },
  ADMIN_NOTE_REQUIRED: {
    status: 422,
    message:
      "Thao tác quản trị yêu cầu nhập lý do ghi chú hợp lệ (tối thiểu 10 ký tự).",
  },
  USER_ALREADY_DELETED: {
    status: 409,
    message: "Tài khoản người dùng đã bị xoá và không thể thực hiện thao tác.",
  },
  CHILD_PENDING_DELETION: {
    status: 409,
    message:
      "Hồ sơ trẻ đang trong thời gian chờ xoá và không thể thực hiện thao tác.",
  },
  PACKAGE_NOT_FOUND: {
    status: 404,
    message: "Không tìm thấy gói dịch vụ.",
  },
  UNKNOWN_ENTITLEMENT_KEY: {
    status: 500,
    message: "Khóa quyền lợi không hợp lệ.",
  },
  PACKAGE_NOT_SELLABLE: {
    status: 400,
    message: "Gói dịch vụ hiện không mở bán.",
  },
  OFFER_NOT_FOUND: {
    status: 400,
    message: "Không tìm thấy gói ưu đãi tương ứng.",
  },
  ORDER_ALREADY_PENDING: {
    status: 409,
    message: "Bạn đã có đơn hàng chưa xử lý cho gói này.",
  },
  ORDER_ALREADY_PROCESSED: {
    status: 409,
    message: "Đơn hàng đã được xử lý trước đó.",
  },
  PAYMENT_PROOF_REQUIRED: {
    status: 422,
    message: "Vui lòng nhập mã giao dịch để nộp chứng từ.",
  },
  INVALID_STATUS_TRANSITION: {
    status: 409,
    message: "Chuyển trạng thái đơn không hợp lệ.",
  },
  UNSUPPORTED_MEDIA_TYPE: {
    status: 415,
    message: "Định dạng tệp không được hỗ trợ (chỉ chấp nhận JPEG, PNG, WEBP).",
  },
  ORDER_CANNOT_BE_CANCELLED: {
    status: 409,
    message: "Chỉ có thể huỷ đơn hàng ở trạng thái chờ thanh toán.",
  },
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_DEFINITIONS;
export type AuthErrorDetails = Readonly<Record<string, unknown>> | string;

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
    const msg =
      typeof details === "string"
        ? details
        : (definition?.message ?? "Đã xảy ra lỗi.");
    super(msg);
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
