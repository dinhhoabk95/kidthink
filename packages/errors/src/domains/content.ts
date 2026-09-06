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

export const SkillNotFoundError = defineModelNotFound(
  "SkillNotFoundError",
  "skills",
  "Không tìm thấy kỹ năng."
);

export const SeoPageNotFoundError = defineModelNotFound(
  "SeoPageNotFoundError",
  "seo_pages",
  "Không tìm thấy trang SEO."
);

export const InvalidCodeFormatError = defineError({
  code: "INVALID_CODE_FORMAT",
  message: "Định dạng mã không hợp lệ.",
  status: 400,
});

export const VersionAlreadyDraftedError = defineError({
  code: "VERSION_ALREADY_DRAFTED",
  message: "Đã có bản nháp chưa phát hành.",
  status: 409,
});

export const VersionNotFoundError = defineError({
  code: "VERSION_NOT_FOUND",
  message: "Phiên bản nội dung không tồn tại.",
  status: 404,
});

export const CannotRollbackToCurrentError = defineError({
  code: "CANNOT_ROLLBACK_TO_CURRENT",
  message: "Không thể khôi phục về chính phiên bản hiện tại.",
  status: 409,
});

export const ContentImmutableError = defineError({
  code: "CONTENT_IMMUTABLE",
  message: "Nội dung đã phát hành không thể chỉnh sửa trực tiếp.",
  status: 409,
});

export const ContentInUseError = defineError<{
  readonly used_by?: readonly string[];
}>({
  code: "CONTENT_IN_USE",
  message: "Nội dung đang được sử dụng và không thể xoá.",
  status: 409,
});

export const CodeImmutableError = defineError({
  code: "CODE_IMMUTABLE",
  message: "Mã định danh đã phát hành không thể thay đổi.",
  status: 409,
});

export const CodeAlreadyExistsError = defineError({
  code: "CODE_ALREADY_EXISTS",
  message: "Mã định danh đã tồn tại trong hệ thống.",
  status: 409,
});

export const CodeAllocationFailedError = defineError({
  code: "CODE_ALLOCATION_FAILED",
  message: "Cấp mã tự động thất bại do trùng lặp.",
  status: 500,
});

export const PublishChecklistFailedError = defineError<{
  readonly missing?: readonly string[];
}>({
  code: "PUBLISH_CHECKLIST_FAILED",
  message: "Chưa đạt đủ điều kiện để phát hành nội dung.",
  status: 422,
});

export const ThemeNotSupportedError = defineError({
  code: "THEME_NOT_SUPPORTED",
  message: "Chủ đề nội dung không được hỗ trợ.",
  status: 422,
});

export const AudioFormatInvalidError = defineError({
  code: "AUDIO_FORMAT_INVALID",
  message: "Định dạng âm thanh không hợp lệ.",
  status: 415,
});

export const AudioSizeLimitExceededError = defineError({
  code: "AUDIO_SIZE_LIMIT_EXCEEDED",
  message: "Dung lượng âm thanh vượt quá giới hạn cho phép.",
  status: 413,
});
