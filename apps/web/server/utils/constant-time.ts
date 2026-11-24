/**
 * So sánh hai chuỗi trong thời gian không phụ thuộc vị trí byte khác nhau đầu tiên.
 * Chạy được cả Node lẫn workerd (không cần `node:crypto`).
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let mismatches = left.length === right.length ? 0 : 1;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    mismatches += (left[i] ?? 0) === (right[i] ?? 0) ? 0 : 1;
  }
  return mismatches === 0;
}
