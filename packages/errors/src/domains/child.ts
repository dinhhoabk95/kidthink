/**
 * Hồ sơ trẻ và cổng người lớn — ERROR-CODES §7.6.
 *
 * Mỗi mã là một lớp. Lớp không khai `status` thì nhận 400 từ base.
 * ❌ NEVER thêm mã mới ở đây mà không đăng ký vào bảng §7 của
 * `docs/specs/00-foundation/error-codes.md` (`BR-ERR-01`).
 */

import { defineError } from "../base.ts";
import { defineModelNotFound } from "../model.ts";

export const NoActiveChildError = defineError({
  code: "NO_ACTIVE_CHILD",
  message: "Hãy chọn hồ sơ bé trước khi tiếp tục.",
  status: 428,
});

export const ChildPendingDeletionError = defineError({
  code: "CHILD_PENDING_DELETION",
  message:
    "Hồ sơ trẻ đang trong thời gian chờ xoá và không thể thực hiện thao tác.",
  status: 409,
});

export const ParentGateInvalidError = defineError({
  code: "PARENT_GATE_INVALID",
  message: "Thử thách cổng người lớn không hợp lệ.",
});

export const ParentGateExpiredError = defineError({
  code: "PARENT_GATE_EXPIRED",
  message: "Thử thách cổng người lớn đã hết hạn.",
  status: 410,
});

export const ParentGateFailedError = defineError({
  code: "PARENT_GATE_FAILED",
  message: "Câu trả lời thử thách cổng người lớn không chính xác.",
  status: 403,
});

export const ChildNotFoundError = defineModelNotFound(
  "ChildNotFoundError",
  "child_profiles",
  "Không tìm thấy hồ sơ bé."
);

export const ChildFieldNotAllowedError = defineError<{
  readonly unallowedFields?: readonly string[];
}>({
  code: "CHILD_FIELD_NOT_ALLOWED",
  message: "Thông tin hồ sơ chứa trường không được phép.",
  status: 400,
});

export const ChildAgeOutOfRangeError = defineError<{
  readonly birth_year?: number;
}>({
  code: "CHILD_AGE_OUT_OF_RANGE",
  message: "Độ tuổi của bé phải từ 3 đến 6 tuổi.",
  status: 422,
});

export const AvatarNotInPresetError = defineError<{
  readonly avatar_id?: string;
}>({
  code: "AVATAR_NOT_IN_PRESET",
  message: "Ảnh đại diện không thuộc danh sách cho phép.",
  status: 400,
});
