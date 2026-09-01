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
  MFA_ALREADY_ENABLED: {
    status: 409,
    message: "Tài khoản quản trị đã thiết lập xác thực hai yếu tố.",
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
  INTERNAL_ERROR: {
    status: 500,
    message: "Hệ thống gặp sự cố. Vui lòng thử lại sau ít phút.",
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
    /**
     * Mã chung cho mọi loại payload vượt trần — cột "Khi nào" của
     * `error-codes.md` mục 7 để **rỗng** đúng vì vậy.
     *
     * Message cũ viết "Dữ liệu sự kiện" nên chỉ đúng cho một trong sáu chỗ đang
     * ném mã này: hai guard body request, upload ảnh, ảnh chứng từ đơn hàng, lô
     * event của phiên chơi, và trần payload config ở `game-config-runtime.ts`.
     */
    status: 413,
    message: "Dữ liệu vượt quá giới hạn cho phép.",
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
    message: "Thử thách cổng người lớn không hợp lệ.",
  },
  PARENT_GATE_EXPIRED: {
    status: 410,
    message: "Thử thách cổng người lớn đã hết hạn.",
  },
  PARENT_GATE_FAILED: {
    status: 403,
    message: "Câu trả lời thử thách cổng người lớn không chính xác.",
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
  ENTITLEMENT_REQUIRED: {
    status: 403,
    message: "Tính năng này thuộc gói dịch vụ bổ sung.",
  },
  QUOTA_EXCEEDED: {
    status: 402,
    message: "Bạn đã dùng hết hạn mức của gói dịch vụ.",
  },
  INSUFFICIENT_CREDITS: {
    status: 402,
    message: "Số dư AI credit không đủ.",
  },
  VERSION_CONFLICT: {
    status: 409,
    message: "Phiên bản dữ liệu đã thay đổi. Vui lòng tải lại trang.",
  },
  MODERATION_BLOCKED: {
    status: 422,
    message: "Nội dung không qua được bộ lọc kiểm duyệt an toàn.",
  },
  WEBHOOK_SIGNATURE_INVALID: {
    status: 401,
    message: "Chữ ký số webhook không hợp lệ.",
  },
  WEBHOOK_REPLAY_DETECTED: {
    status: 409,
    message: "Yêu cầu webhook quá hạn hoặc phát lại.",
  },
  RECONCILIATION_MISMATCH: {
    status: 409,
    message: "Phát hiện sai lệch đối soát thanh toán.",
  },
  SUBSCRIPTION_ALREADY_CANCELLED: {
    status: 409,
    message: "Gói thuê bao định kỳ đã được huỷ tự gia hạn.",
  },
  REFUND_EXCEEDS_CAPTURED_AMOUNT: {
    status: 422,
    message: "Số tiền hoàn vượt quá số tiền thực thu của đơn hàng.",
  },
  REFUND_ALREADY_PROCESSED: {
    status: 409,
    message: "Lệnh hoàn tiền đã được xử lý trước đó.",
  },
  OFFLINE_PACK_EXPIRED: {
    status: 410,
    message: "Gói học tập offline đã hết hạn lease.",
  },
  OFFLINE_PACK_CORRUPTED: {
    status: 422,
    message: "Gói học tập offline bị lỗi toàn vẹn hoặc sai checksum.",
  },
  STORAGE_QUOTA_INSUFFICIENT: {
    status: 422,
    message: "Bộ nhớ thiết bị không đủ để tải gói offline.",
  },
  MFA_SECRET_CORRUPTED: {
    status: 500,
    message: "Hệ thống không đọc được khoá xác thực. Vui lòng liên hệ hỗ trợ.",
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
  /**
   * h3 v1 nhận diện lỗi HTTP bằng duck-type `constructor.__h3_error__`
   * (`isError()` trong h3/dist/index.mjs). Khai cờ này cùng ba getter
   * `statusCode` / `statusMessage` / `data` làm AppError trở thành H3Error
   * hạng nhất: `throw appError(...)` ở bất kỳ tầng nào — service, guard,
   * route — đều được Nitro trả về đúng status và đúng body mà route KHÔNG
   * phải tự bọc try/catch để chuyển đổi.
   *
   * Cùng tư tưởng với `HttpException` của Laravel implement
   * `HttpExceptionInterface`: lỗi domain tự khai được HTTP surface của nó,
   * handler chung chỉ việc render.
   *
   * Đây là toàn bộ chỗ `packages/auth` biết tới giao thức h3 — một tên thuộc
   * tính, không import h3. ❌ NEVER thêm phụ thuộc h3 vào package này.
   */
  static readonly __h3_error__ = true;

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

  /** Surface H3Error: HTTP status của mã lỗi (ERROR-CODES §7). */
  get statusCode(): number {
    return this.status;
  }

  /**
   * Surface H3Error: `statusMessage` là **mã lỗi**, không phải thông báo.
   * ERROR-CODES `BR-ERR-06` — client bắt theo mã, không theo chuỗi; chuỗi
   * tiếng Việt đổi được cho UX, mã thì bất biến. h3 cũng sanitize
   * `statusMessage`, nên đặt chuỗi tiếng Việt vào đó là sai chỗ.
   */
  get statusMessage(): AuthErrorCode {
    return this.code;
  }

  /** Surface H3Error: body lỗi theo ERROR-CODES §7.1. */
  get data(): AuthErrorResponse {
    return this.toResponse();
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
