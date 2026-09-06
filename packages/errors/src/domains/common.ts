/**
 * Mã dùng chung cho mọi domain — ERROR-CODES §7.7.
 *
 * Mỗi mã là một lớp. Lớp không khai `status` thì nhận 400 từ base.
 * ❌ NEVER thêm mã mới ở đây mà không đăng ký vào bảng §7 của
 * `docs/specs/00-foundation/error-codes.md` (`BR-ERR-01`).
 */

import { defineError } from "../base.ts";

/**
 * ⚠️ Ưu tiên lớp not-found theo model (`defineModelNotFound`) — chúng mang thêm
 * `model` + `key` cho log mà không lộ ra body. Chỉ dùng lớp trần này khi thật
 * sự không có model nào đứng sau.
 */
export const NotFoundError = defineError({
  code: "NOT_FOUND",
  message: "Không tìm thấy nội dung.",
  status: 404,
});

/**
 * ⚠️ Route ❌ NEVER ném lớp này trực tiếp — dùng `ValidationError` (`../model.ts`)
 * để body luôn có `details.fields[]`. Lớp này chỉ tồn tại cho registry.
 */
export const ValidationFailedError = defineError({
  code: "VALIDATION_FAILED",
  message: "Dữ liệu yêu cầu không hợp lệ.",
  status: 422,
});

export const RateLimitedError = defineError<{ readonly retry_after_s: number }>(
  {
    code: "RATE_LIMITED",
    message: "Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít phút.",
    status: 429,
  }
);

export const ServiceUnavailableError = defineError({
  code: "SERVICE_UNAVAILABLE",
  message: "Hệ thống tạm thời không khả dụng. Vui lòng thử lại sau.",
  status: 503,
});

export const InternalError = defineError({
  code: "INTERNAL_ERROR",
  message: "Hệ thống gặp sự cố. Vui lòng thử lại sau ít phút.",
  status: 500,
});

/**
 * Mã chung cho MỌI loại payload vượt trần — cột "Khi nào" của ERROR-CODES §7.7
 * để **rỗng** đúng vì vậy. Sáu chỗ đang ném mã này: hai guard body request,
 * upload ảnh, ảnh chứng từ đơn hàng, lô event của phiên chơi, và trần payload
 * config ở `game-config-runtime.ts`.
 */
export const PayloadTooLargeError = defineError({
  code: "PAYLOAD_TOO_LARGE",
  message: "Dữ liệu vượt quá giới hạn cho phép.",
  status: 413,
});

// biome-ignore lint/performance/noBarrelFile: re-export ValidationError for common HTTP errors
export {
  type ValidationDetails,
  ValidationError,
  type ValidationFieldError,
} from "../model.ts";
