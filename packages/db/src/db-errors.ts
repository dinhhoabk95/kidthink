/**
 * Nhận diện lỗi trùng khoá duy nhất (UNIQUE) của SQLite local (`node:sqlite`) và Cloudflare D1.
 *
 * Hình dạng lỗi thật (đo bằng một lệnh INSERT trùng `users.uuid` qua `getOwnerDb()`):
 * `code = "ERR_SQLITE_ERROR"`, `errcode = 2067`, `errstr = "constraint failed"`,
 * `message = "UNIQUE constraint failed: users.uuid"`. D1 chỉ chắc chắn có `message` dạng
 * `UNIQUE constraint failed: ...` (có thể nằm ở `cause`). ❌ Không còn mã Postgres `23505`.
 */

const MAX_CAUSE_DEPTH = 5;
const SQLITE_CONSTRAINT_UNIQUE = 2067;
const SQLITE_CONSTRAINT_PRIMARYKEY = 1555;
const NODE_SQLITE_ERROR_CODE = "ERR_SQLITE_ERROR";
const UNIQUE_MESSAGE_PATTERN = /UNIQUE constraint failed/i;

type ErrorCandidate = Error | object | null | undefined;

function isUniqueNode(node: object): boolean {
  const code = Reflect.get(node, "code");
  const errcode = Reflect.get(node, "errcode");
  if (
    code === NODE_SQLITE_ERROR_CODE &&
    (errcode === SQLITE_CONSTRAINT_UNIQUE ||
      errcode === SQLITE_CONSTRAINT_PRIMARYKEY)
  ) {
    return true;
  }
  const message = Reflect.get(node, "message");
  return typeof message === "string" && UNIQUE_MESSAGE_PATTERN.test(message);
}

function nodeMentionsColumns(
  node: object,
  columns: readonly string[]
): boolean {
  const message = Reflect.get(node, "message");
  return (
    typeof message === "string" &&
    columns.every((column) => message.includes(column))
  );
}

/**
 * `true` khi `error` (hoặc một `cause` trong tối đa 5 tầng) là vi phạm UNIQUE.
 * Truyền `columns` (dạng `"table.col"`) để chỉ khớp đúng ràng buộc mong muốn; không truyền thì
 * khớp mọi ràng buộc UNIQUE.
 */
export function isUniqueConstraintError(
  error: ErrorCandidate,
  columns?: readonly string[]
): boolean {
  let node: ErrorCandidate = error;
  for (let depth = 0; depth <= MAX_CAUSE_DEPTH; depth++) {
    if (typeof node !== "object" || node === null) {
      return false;
    }
    if (
      isUniqueNode(node) &&
      (!columns || nodeMentionsColumns(node, columns))
    ) {
      return true;
    }
    const next: ErrorCandidate = Reflect.get(node, "cause");
    node = next;
  }
  return false;
}
