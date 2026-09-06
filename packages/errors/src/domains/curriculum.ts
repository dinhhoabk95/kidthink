/**
 * Chương trình học và lộ trình cá nhân — ERROR-CODES §7.4 và §7.5.
 *
 * Mỗi mã là một lớp. Lớp không khai `status` thì nhận 400 từ base.
 * ❌ NEVER thêm mã mới ở đây mà không đăng ký vào bảng §7 của
 * `docs/specs/00-foundation/error-codes.md` (`BR-ERR-01`).
 */

import { defineError } from "../base.ts";
import { defineModelNotFound } from "../model.ts";

export const CurriculumNotFoundError = defineModelNotFound(
  "CurriculumNotFoundError",
  "curricula",
  "Không tìm thấy chương trình học."
);

export const PersonalCurriculumNotFoundError = defineModelNotFound(
  "PersonalCurriculumNotFoundError",
  "personal_curricula",
  "Không tìm thấy lộ trình học cá nhân."
);

/** Trẻ đã đăng ký một chương trình học khác đang hoạt động. */
export const AlreadyEnrolledError = defineError<{
  readonly curriculum_code: string;
}>({
  code: "ALREADY_ENROLLED",
  message: "Trẻ đang tham gia một chương trình học khác.",
  status: 409,
});
