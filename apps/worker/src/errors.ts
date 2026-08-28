/**
 * Đọc thông điệp lỗi từ giá trị `unknown` bắt được ở `catch`.
 *
 * `catch (err: unknown)` rồi đọc thẳng `err.message` là lỗi kiểu — và nó tồn
 * tại ở bốn chỗ trong worker suốt nhiều tháng vì `apps/worker` chưa từng đi qua
 * cổng typecheck nào. Ép kiểu `(err as Error).message` cũng không đúng: giá trị
 * ném ra có thể là chuỗi, số, hay `null`.
 */
export function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}
