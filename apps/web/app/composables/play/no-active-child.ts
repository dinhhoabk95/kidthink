import { normalizeApiError } from "@mindkid/errors/client";

const PRECONDITION_REQUIRED = 428;
const UNAUTHORIZED = 401;

/**
 * Phụ huynh đã đăng nhập nhưng chưa có `active_child_id` hợp lệ: API `/api/users/play/*`
 * trả 428 `NO_ACTIVE_CHILD`. Bề mặt trẻ phải đưa về màn chọn hồ sơ bé
 * (`play-entry-and-profile-select.md` §5), không được rơi âm thầm về giao diện guest.
 */
export function isNoActiveChildError(err: Error | object | null): boolean {
  if (err === null) {
    return false;
  }
  const normalized = normalizeApiError(err);
  return (
    normalized.code === "NO_ACTIVE_CHILD" ||
    normalized.statusCode === PRECONDITION_REQUIRED
  );
}

/** Chưa đăng nhập (guest): được phép rơi về endpoint `/api/guest/*`. */
export function isUnauthenticatedError(err: Error | object | null): boolean {
  if (err === null) {
    return false;
  }
  const normalized = normalizeApiError(err);
  return (
    normalized.code === "UNAUTHENTICATED" ||
    normalized.statusCode === UNAUTHORIZED
  );
}
