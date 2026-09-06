/**
 * Đăng nhập mạng xã hội và OAuth — ERROR-CODES §7.2a.
 *
 * Mỗi mã là một lớp. Lớp không khai `status` thì nhận 400 từ base.
 * ❌ NEVER thêm mã mới ở đây mà không đăng ký vào bảng §7 của
 * `docs/specs/00-foundation/error-codes.md` (`BR-ERR-01`).
 */

import { defineError } from "../base.ts";

export const SocialEmailConflictError = defineError({
  code: "SOCIAL_EMAIL_CONFLICT",
  message:
    "Email này đã được sử dụng bởi tài khoản khác. Vui lòng đăng nhập bằng mật khẩu.",
  status: 409,
});

export const SocialIdentityAlreadyLinkedError = defineError({
  code: "SOCIAL_IDENTITY_ALREADY_LINKED",
  message: "Tài khoản mạng xã hội này đã được liên kết với người dùng khác.",
  status: 409,
});

export const SocialProviderAlreadyLinkedError = defineError({
  code: "SOCIAL_PROVIDER_ALREADY_LINKED",
  message: "Bạn đã liên kết với nhà cung cấp mạng xã hội này rồi.",
  status: 409,
});

export const LastLoginMethodError = defineError<{
  readonly set_password_url: string;
}>({
  code: "LAST_LOGIN_METHOD",
  message:
    "Không thể huỷ liên kết vì đây là phương thức đăng nhập duy nhất của tài khoản.",
  status: 409,
});

export const OauthProviderDisabledError = defineError({
  code: "OAUTH_PROVIDER_DISABLED",
  message: "Nhà cung cấp đăng nhập này hiện chưa khả dụng.",
  status: 404,
});

export const OauthStateInvalidError = defineError({
  code: "OAUTH_STATE_INVALID",
  message: "Phiên xác thực mạng xã hội không hợp lệ hoặc đã hết hạn.",
});

export const OauthProviderError = defineError({
  code: "OAUTH_PROVIDER_ERROR",
  message: "Lỗi kết nối từ nhà cung cấp đăng nhập mạng xã hội.",
  status: 502,
});
