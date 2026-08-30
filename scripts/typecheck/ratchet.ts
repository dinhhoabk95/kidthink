/**
 * Bậc thang nợ: "số chỉ được giảm, file mới có nợ là fail".
 *
 * Chỉ còn cổng typecheck (`scripts/typecheck/typecheck-delta.ts`) dùng luật này
 * — cổng `BR-TYP-02` (ép kiểu) đã bị gỡ cùng `packages/gates`.
 */

/** Bảng `đường-dẫn-tương-đối-gốc-repo` → số lượng nợ. */
export type Counts = Record<string, number>;

export interface RatchetResult {
  readonly increased: readonly { file: string; from: number; to: number }[];
  readonly added: readonly { file: string; to: number }[];
  readonly decreased: readonly { file: string; from: number; to: number }[];
  readonly removed: readonly string[];
}

export function compareToBaseline(
  current: Counts,
  baseline: Counts
): RatchetResult {
  const increased: { file: string; from: number; to: number }[] = [];
  const added: { file: string; to: number }[] = [];
  const decreased: { file: string; from: number; to: number }[] = [];
  const removed: string[] = [];

  for (const [file, to] of Object.entries(current)) {
    const from = baseline[file];
    if (from === undefined) {
      added.push({ file, to });
    } else if (to > from) {
      increased.push({ file, from, to });
    } else if (to < from) {
      decreased.push({ file, from, to });
    }
  }
  for (const file of Object.keys(baseline)) {
    if (current[file] === undefined) {
      removed.push(file);
    }
  }
  return { increased, added, decreased, removed };
}

export function hasRegression(result: RatchetResult): boolean {
  return result.increased.length > 0 || result.added.length > 0;
}

/**
 * Bậc thang chỉ đi **xuống**: liệt kê mọi file mà `--update` sẽ làm tăng nợ.
 *
 * Không có phép kiểm này thì `--update` chỉ là "ghi đè baseline bằng số hiện
 * tại", và nó đã được dùng đúng như thế: Task #124 ghi thêm 187 lỗi, Task #125
 * thêm 7 — toàn bộ là mã mới viết trong cùng dải task, trong đó 180 lỗi chỉ là
 * một từ sai. Docstring của cổng nói "số lỗi chỉ được giảm"; giờ mã nói vậy.
 */
export function refuseIncrease(
  next: Counts,
  baseline: Counts
): { file: string; from: number; to: number }[] {
  const worse: { file: string; from: number; to: number }[] = [];
  for (const [file, to] of Object.entries(next)) {
    const from = baseline[file] ?? 0;
    if (to > from) {
      worse.push({ file, from, to });
    }
  }
  return worse.sort((a, b) => a.file.localeCompare(b.file));
}

export function total(counts: Counts): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

export function sortCounts(counts: Counts): Counts {
  return Object.fromEntries(
    Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
  );
}

/** Đọc một nhánh baseline từ JSON đã parse — bỏ mọi giá trị không phải số. */
export function readCounts(value: unknown): Counts {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const counts: Counts = {};
  for (const [file, n] of Object.entries(value)) {
    if (typeof n === "number") {
      counts[file] = n;
    }
  }
  return counts;
}
