/**
 * Gói học tập offline — ERROR-CODES §7.3.
 *
 * Mỗi mã là một lớp. Lớp không khai `status` thì nhận 400 từ base.
 * ❌ NEVER thêm mã mới ở đây mà không đăng ký vào bảng §7 của
 * `docs/specs/00-foundation/error-codes.md` (`BR-ERR-01`).
 */

import { defineError } from "../base.ts";
import { defineModelNotFound } from "../model.ts";

export const OfflinePackExpiredError = defineError({
  code: "OFFLINE_PACK_EXPIRED",
  message: "Gói học tập offline đã hết hạn lease.",
  status: 410,
});

export const OfflinePackCorruptedError = defineError({
  code: "OFFLINE_PACK_CORRUPTED",
  message: "Gói học tập offline bị lỗi toàn vẹn hoặc sai checksum.",
  status: 422,
});

export const StorageQuotaInsufficientError = defineError({
  code: "STORAGE_QUOTA_INSUFFICIENT",
  message: "Bộ nhớ thiết bị không đủ để tải gói offline.",
  status: 422,
});

export const OfflinePackNotFoundError = defineModelNotFound(
  "OfflinePackNotFoundError",
  "offline_packs",
  "Không tìm thấy gói học tập ngoại tuyến."
);
