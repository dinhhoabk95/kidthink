/**
 * Màn chơi, template và bố cục — ERROR-CODES §7.4 và §7.5.
 *
 * Mỗi mã là một lớp. Lớp không khai `status` thì nhận 400 từ base.
 * ❌ NEVER thêm mã mới ở đây mà không đăng ký vào bảng §7 của
 * `docs/specs/00-foundation/error-codes.md` (`BR-ERR-01`).
 */

import type { JsonValue } from "../base.ts";
import { defineError } from "../base.ts";
import { defineModelNotFound } from "../model.ts";

export const GameLevelNotFoundError = defineModelNotFound(
  "GameLevelNotFoundError",
  "game_levels",
  "Không tìm thấy màn chơi."
);

export const CustomGameNotFoundError = defineModelNotFound(
  "CustomGameNotFoundError",
  "custom_games",
  "Không tìm thấy trò chơi tùy chỉnh."
);

/**
 * Client yêu cầu template không có trong registry.
 *
 * Thông báo cũ ở `managers/levels/index.post.ts` là tiếng Anh nội suy
 * (`Template ${code} is not supported`) — vi phạm `BR-ERR-04`. Mã template đi
 * vào `details` để client vẫn phân nhánh được, thân thông báo thì tiếng Việt.
 */
export const TemplateNotSupportedError = defineError<{
  readonly template_code: string;
}>({
  code: "TEMPLATE_NOT_SUPPORTED",
  message: "Loại trò chơi này chưa được hỗ trợ.",
  status: 422,
});

/** `layout_id` không thuộc `layouts` của template (`BR-LAY-02`). */
export const LayoutNotSupportedError = defineError<{
  readonly layout_id: string;
  readonly template_code: string;
}>({
  code: "LAYOUT_NOT_SUPPORTED",
  message: "Bố cục này không thuộc loại trò chơi đã chọn.",
  status: 422,
});

/**
 * Trẻ chưa đi qua bài làm quen của một hoặc nhiều strand mà level chạm tới
 * (`BR-CIG-01`). Client dùng `details` để dựng hàng đợi làm quen rồi quay lại
 * `return_level_code`.
 */
export const IntroRequiredError = defineError<{
  readonly intro_queue: readonly JsonValue[];
  readonly intro_remaining: number;
  readonly return_level_code: string;
  readonly primary_skill_code: string;
  readonly intro_level_code: string;
}>({
  code: "INTRO_REQUIRED",
  message: "Bé cần hoàn thành bài làm quen trước khi chơi.",
  status: 428,
});

export const ContentPackInvalidError = defineError<{
  readonly details?: JsonValue;
  readonly round_index?: number;
  readonly issues?: readonly JsonValue[];
}>({
  code: "CONTENT_PACK_INVALID",
  message: "Gói nội dung màn chơi không hợp lệ.",
  status: 422,
});
