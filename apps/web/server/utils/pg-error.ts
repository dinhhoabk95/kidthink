const UNIQUE_VIOLATION = "23505";

/**
 * Đọc SQLSTATE của lỗi Postgres.
 *
 * Không dùng `as`: `Reflect.get` + kiểm `typeof` là cách hẹp kiểu thật sự, còn
 * `(err as { code?: string }).code` chỉ nói dối trình biên dịch — nếu lỗi
 * không có `code` thì cả hai đều ra `undefined`, nhưng chỉ cách này không tắt
 * kiểm tra kiểu (TYPE-SAFETY `BR-TYP-02`).
 *
 * `postgres.js` đôi khi bọc lỗi gốc trong `cause`, nên phải xem cả hai tầng.
 */
export function readPostgresErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const direct = Reflect.get(error, "code");
  if (typeof direct === "string") {
    return direct;
  }

  const cause = Reflect.get(error, "cause");
  if (typeof cause === "object" && cause !== null) {
    const nested = Reflect.get(cause, "code");
    if (typeof nested === "string") {
      return nested;
    }
  }

  return undefined;
}

/** Trùng khoá duy nhất — dùng để retry cấp mã. */
export function isUniqueViolation(error: unknown): boolean {
  return readPostgresErrorCode(error) === UNIQUE_VIOLATION;
}
