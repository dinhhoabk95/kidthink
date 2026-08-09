export const AUTH_ERROR_DEFINITIONS = {
  UNAUTHENTICATED: {
    status: 401,
    message: "Bạn cần đăng nhập để tiếp tục.",
  },
  INSUFFICIENT_ROLE: {
    status: 403,
    message: "Bạn không có quyền truy cập mục này.",
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
    super(definition.message);
    this.name = "AppError";
    this.code = code;
    this.status = definition.status;
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
