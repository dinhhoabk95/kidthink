/**
 * Nội dung, phiên bản và kiểm duyệt — ERROR-CODES §7.4.
 *
 * Mỗi mã là một lớp. Lớp không khai `status` thì nhận 400 từ base.
 * ❌ NEVER thêm mã mới ở đây mà không đăng ký vào bảng §7 của
 * `docs/specs/00-foundation/error-codes.md` (`BR-ERR-01`).
 */

import { defineError } from "../base.ts";
import { defineModelNotFound } from "../model.ts";

export const ContentArchivedError = defineError({
  code: "CONTENT_ARCHIVED",
  message: "Nội dung này đã ngừng phát hành.",
  status: 410,
});

export const VersionConflictError = defineError({
  code: "VERSION_CONFLICT",
  message: "Phiên bản dữ liệu đã thay đổi. Vui lòng tải lại trang.",
  status: 409,
});

export const InvalidStatusTransitionError = defineError({
  code: "INVALID_STATUS_TRANSITION",
  message: "Chuyển trạng thái đơn không hợp lệ.",
  status: 409,
});

export const ModerationBlockedError = defineError({
  code: "MODERATION_BLOCKED",
  message: "Nội dung không qua được bộ lọc kiểm duyệt an toàn.",
  status: 422,
});

export const UnsupportedMediaTypeError = defineError({
  code: "UNSUPPORTED_MEDIA_TYPE",
  message: "Định dạng tệp không được hỗ trợ (chỉ chấp nhận JPEG, PNG, WEBP).",
  status: 415,
});

export const LessonNotFoundError = defineModelNotFound(
  "LessonNotFoundError",
  "lessons",
  "Không tìm thấy bài học."
);

export const ActivityNotFoundError = defineModelNotFound(
  "ActivityNotFoundError",
  "activities",
  "Không tìm thấy hoạt động."
);

export const WorksheetNotFoundError = defineModelNotFound(
  "WorksheetNotFoundError",
  "worksheets",
  "Không tìm thấy phiếu bài tập."
);

export const LessonPlanNotFoundError = defineModelNotFound(
  "LessonPlanNotFoundError",
  "lesson_plans",
  "Không tìm thấy giáo án."
);
