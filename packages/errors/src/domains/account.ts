/**
 * Tài khoản người lớn: email, trạng thái, đồng ý điều khoản — ERROR-CODES §7.6.
 *
 * Mỗi mã là một lớp. Lớp không khai `status` thì nhận 400 từ base.
 * ❌ NEVER thêm mã mới ở đây mà không đăng ký vào bảng §7 của
 * `docs/specs/00-foundation/error-codes.md` (`BR-ERR-01`).
 */

import { defineError } from "../base.ts";
import { defineModelNotFound } from "../model.ts";

export const EmailAlreadyRegisteredError = defineError({
  code: "EMAIL_ALREADY_REGISTERED",
  message: "Email này đã được đăng ký tài khoản.",
  status: 409,
});

export const EmailAlreadyInUseError = defineError({
  code: "EMAIL_ALREADY_IN_USE",
  message: "Địa chỉ email này đã được sử dụng bởi một tài khoản khác.",
  status: 409,
});

export const AccountSuspendedError = defineError({
  code: "ACCOUNT_SUSPENDED",
  message: "Tài khoản đang tạm khoá. Liên hệ hỗ trợ.",
  status: 403,
});

export const AccountDeletedError = defineError({
  code: "ACCOUNT_DELETED",
  message: "Tài khoản của bạn đang trong thời gian chờ xoá.",
  status: 403,
});

export const AccountPurgedError = defineError({
  code: "ACCOUNT_PURGED",
  message: "Tài khoản đã bị xoá vĩnh viễn và không thể khôi phục.",
  status: 410,
});

export const UserAlreadyDeletedError = defineError({
  code: "USER_ALREADY_DELETED",
  message: "Tài khoản người dùng đã bị xoá và không thể thực hiện thao tác.",
  status: 409,
});

export const ConsentRequiredError = defineError<{
  readonly types?: readonly string[];
  readonly url?: string;
  readonly reason?: string;
  readonly consent_type?: string;
  readonly requirement_at?: string;
  readonly notice?: string | null;
}>({
  code: "CONSENT_REQUIRED",
  message: "Vui lòng đọc và đồng ý chính sách bảo vệ dữ liệu trẻ em.",
  status: 428,
});

export const ConsentRequirementChangedError = defineError({
  code: "CONSENT_REQUIREMENT_CHANGED",
  message: "Yêu cầu đồng ý vừa được cập nhật. Vui lòng xem lại.",
  status: 409,
});

export const TransactionalNotificationCannotBeDisabledError = defineError({
  code: "TRANSACTIONAL_NOTIFICATION_CANNOT_BE_DISABLED",
  message: "Thông báo giao dịch là bắt buộc và không thể tắt.",
  status: 422,
  className: "TransactionalNotificationCannotBeDisabledError",
});

export const AdminNoteRequiredError = defineError({
  code: "ADMIN_NOTE_REQUIRED",
  message:
    "Thao tác quản trị yêu cầu nhập lý do ghi chú hợp lệ (tối thiểu 10 ký tự).",
  status: 422,
});

export const UserNotFoundError = defineModelNotFound(
  "UserNotFoundError",
  "users",
  "Không tìm thấy người dùng."
);

export const ExportNotFoundError = defineModelNotFound(
  "ExportNotFoundError",
  "export_jobs",
  "Không tìm thấy yêu cầu xuất file."
);

export const ExportRateLimitedError = defineError<{
  readonly retry_after_s?: number;
}>({
  code: "EXPORT_RATE_LIMITED",
  message: "Bạn chỉ có thể xuất dữ liệu 1 lần trong vòng 24 giờ.",
  status: 429,
});

export const NotificationNotFoundError = defineModelNotFound(
  "NotificationNotFoundError",
  "notifications",
  "Không tìm thấy thông báo."
);
