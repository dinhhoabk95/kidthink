/**
 * Đăng nhập, phiên, CSRF, MFA, mật khẩu — ERROR-CODES §7.2.
 *
 * Mỗi mã là một lớp. Lớp không khai `status` thì nhận 400 từ base.
 * ❌ NEVER thêm mã mới ở đây mà không đăng ký vào bảng §7 của
 * `docs/specs/00-foundation/error-codes.md` (`BR-ERR-01`).
 */

import { defineError } from "../base.ts";

export const UnauthenticatedError = defineError({
  code: "UNAUTHENTICATED",
  message: "Bạn cần đăng nhập để tiếp tục.",
  status: 401,
});

export const SessionRevokedError = defineError({
  code: "SESSION_REVOKED",
  message: "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.",
  status: 401,
});

export const TokenExpiredError = defineError({
  code: "TOKEN_EXPIRED",
  message: "Mã xác thực đã hết hạn hoặc không còn hiệu lực.",
  status: 410,
});

export const InvalidCredentialsError = defineError({
  code: "INVALID_CREDENTIALS",
  message: "Email hoặc mật khẩu không chính xác.",
  status: 401,
});

export const InsufficientRoleError = defineError({
  code: "INSUFFICIENT_ROLE",
  message: "Bạn không có quyền truy cập mục này.",
  status: 403,
});

export const CsrfInvalidError = defineError({
  code: "CSRF_INVALID",
  message: "Phiên bảo mật không hợp lệ. Vui lòng tải lại trang và thử lại.",
  status: 403,
});

export const ReauthRequiredError = defineError<{
  readonly methods: readonly string[];
}>({
  code: "REAUTH_REQUIRED",
  message: "Vui lòng xác minh lại danh tính để tiếp tục.",
  status: 428,
});

export const RestrictedModeError = defineError({
  code: "RESTRICTED_MODE",
  message: "Vui lòng xác thực email để thực hiện thao tác này.",
  status: 403,
});

export const MfaAlreadyEnabledError = defineError({
  code: "MFA_ALREADY_ENABLED",
  message: "Tài khoản quản trị đã thiết lập xác thực hai yếu tố.",
  status: 409,
});

export const MfaSecretCorruptedError = defineError({
  code: "MFA_SECRET_CORRUPTED",
  message: "Hệ thống không đọc được khoá xác thực. Vui lòng liên hệ hỗ trợ.",
  status: 500,
});

export const PasswordNotSetError = defineError({
  code: "PASSWORD_NOT_SET",
  message: "Tài khoản chưa có mật khẩu. Hãy dùng Đặt mật khẩu.",
  status: 409,
});

export const PasswordAlreadySetError = defineError({
  code: "PASSWORD_ALREADY_SET",
  message: "Tài khoản đã có mật khẩu. Hãy dùng Đổi mật khẩu.",
  status: 409,
});
