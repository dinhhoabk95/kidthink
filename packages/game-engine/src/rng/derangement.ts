import type { Rng } from "./types.js";

/**
 * Hoán vị không phần tử nào còn ở vị trí cũ (derangement), trả mảng mới.
 *
 * Dùng thuật toán Sattolo: sinh đúng một chu trình độ dài n nên mọi vị trí đều
 * đổi, với n >= 2. Khác `shuffle` (Fisher-Yates) có xác suất 1/e trả lại đúng
 * thứ tự ban đầu — vô nghĩa với bài "sắp xếp" mà đề đã giải sẵn (Task #313).
 * Bảo đảm theo **vị trí**; phần tử trùng giá trị vẫn có thể giống nhau.
 */
export function deriveDerangement<T>(input: readonly T[], rng: Rng): T[] {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.nextInt(i);
    const a = result[i] as T;
    result[i] = result[j] as T;
    result[j] = a;
  }
  return result;
}
