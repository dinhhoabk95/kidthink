/**
 * Phiên chơi và sự kiện chơi — ERROR-CODES §7.5.
 *
 * Mỗi mã là một lớp. Lớp không khai `status` thì nhận 400 từ base.
 * ❌ NEVER thêm mã mới ở đây mà không đăng ký vào bảng §7 của
 * `docs/specs/00-foundation/error-codes.md` (`BR-ERR-01`).
 */

import { defineError } from "../base.ts";
import { defineModelNotFound } from "../model.ts";

export const SessionNotFoundError = defineError({
  code: "SESSION_NOT_FOUND",
  message: "Không tìm thấy phiên chơi.",
  status: 404,
});

export const SessionAlreadyCompletedError = defineError({
  code: "SESSION_ALREADY_COMPLETED",
  message: "Phiên chơi đã hoàn thành.",
  status: 409,
});

export const SessionExpiredError = defineError({
  code: "SESSION_EXPIRED",
  message: "Phiên chơi đã hết hạn.",
  status: 410,
});

export const EventOutOfOrderError = defineError({
  code: "EVENT_OUT_OF_ORDER",
  message: "Thứ tự sự kiện không hợp lệ.",
  status: 409,
});

export const UnknownEventNameError = defineError({
  code: "UNKNOWN_EVENT_NAME",
  message: "Tên sự kiện không hợp lệ.",
  status: 422,
});

export const InvalidSequenceError = defineError({
  code: "INVALID_SEQUENCE",
  message: "Mã thứ tự sự kiện không hợp lệ.",
});

export const BatchTooLargeError = defineError({
  code: "BATCH_TOO_LARGE",
  message: "Kích thước lô sự kiện vượt quá giới hạn.",
  status: 413,
});

export const DailyPlayCapReachedError = defineError({
  code: "DAILY_PLAY_CAP_REACHED",
  message: "Đã đạt giới hạn thời gian chơi trong ngày.",
  status: 402,
});

/**
 * Phiên chơi có mã riêng `SESSION_NOT_FOUND` (§7.5), không dùng `NOT_FOUND`
 * chung. Ưu tiên lớp này thay cho `SessionNotFoundError` trần — nó mang thêm
 * `model` + `key` cho log mà ❌ NEVER lộ ra body (`BR-ERR-03`).
 */
export const PlaySessionNotFoundError = defineModelNotFound(
  "PlaySessionNotFoundError",
  "play_sessions",
  "Không tìm thấy phiên chơi.",
  "SESSION_NOT_FOUND"
);

export const EventDuplicateError = defineError({
  code: "EVENT_DUPLICATE",
  message: "Sự kiện đã được ghi nhận trước đó.",
  status: 200,
});
