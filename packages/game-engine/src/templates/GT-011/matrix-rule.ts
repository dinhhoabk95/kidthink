/**
 * Quy luật của `GT-011`, tách khỏi `template.ts` để `refine` của contract và Session
 * dùng **cùng một** cách tính — như `GT-009/deduction.ts`.
 *
 * Quy luật giữ ở dạng dữ liệu, không ở dạng ảnh dựng sẵn (mục 7.2 spec khuôn):
 * mỗi hàng chứa **cùng một tập ký hiệu**, và mỗi cột cũng vậy. Ma trận xoay là
 * hoán vị vòng của cùng tập đó nên vẫn thoả — đó là lý do quy luật này đủ cho cả
 * WB21 dạng 1, ma trận 2×2 của WB15, và biến thể xoay.
 */

export interface MatrixAsset {
  readonly kind: string;
  readonly ref?: string;
  readonly path?: string;
}

export interface MatrixCell {
  readonly row: number;
  readonly col: number;
  readonly asset: MatrixAsset | null;
}

export interface MatrixShape {
  readonly rows: number;
  readonly cols: number;
  readonly cells: readonly MatrixCell[];
}

export interface MatrixOption {
  readonly option_id: string;
  readonly asset: MatrixAsset;
  readonly is_correct: boolean;
}

export interface MatrixContentShape {
  readonly matrix: MatrixShape;
  readonly options: readonly MatrixOption[];
}

/** Khoá so sánh của một ký hiệu — `ref` cho emoji, `path` cho ảnh. */
export function assetKey(asset: MatrixAsset): string {
  return `${asset.kind}:${asset.ref ?? asset.path ?? ""}`;
}

export function findBlankCell(matrix: MatrixShape): MatrixCell | undefined {
  return matrix.cells.find((cell) => cell.asset === null);
}

function lineKeys(
  matrix: MatrixShape,
  axis: "row" | "col",
  line: number,
  filled: MatrixAsset | null
): string[] | null {
  const keys: string[] = [];
  for (const cell of matrix.cells) {
    if (cell[axis] !== line) {
      continue;
    }
    const asset = cell.asset ?? filled;
    if (!asset) {
      return null;
    }
    keys.push(assetKey(asset));
  }
  return keys.sort();
}

function linesAgree(
  matrix: MatrixShape,
  axis: "row" | "col",
  filled: MatrixAsset
): boolean {
  const blank = findBlankCell(matrix);
  if (!blank) {
    return false;
  }
  const target = lineKeys(matrix, axis, blank[axis], filled);
  if (!target) {
    return false;
  }
  const lineCount = axis === "row" ? matrix.rows : matrix.cols;
  for (let line = 0; line < lineCount; line++) {
    if (line === blank[axis]) {
      continue;
    }
    const other = lineKeys(matrix, axis, line, null);
    if (!other) {
      continue; // hàng hoặc cột khác cũng khuyết: bỏ qua, contract đã ép chỉ một ô trống
    }
    if (other.join("|") !== target.join("|")) {
      return false;
    }
  }
  return true;
}

/** Đặt thử một ký hiệu vào ô trống: hàng khớp quy luật hay không. */
export function rowMatches(matrix: MatrixShape, filled: MatrixAsset): boolean {
  return linesAgree(matrix, "row", filled);
}

/** Đặt thử một ký hiệu vào ô trống: cột khớp quy luật hay không. */
export function colMatches(matrix: MatrixShape, filled: MatrixAsset): boolean {
  return linesAgree(matrix, "col", filled);
}

/** Option nào làm cả hàng lẫn cột khớp quy luật. */
export function optionsSatisfyingRule(
  content: MatrixContentShape
): MatrixOption[] {
  return content.options.filter(
    (option) =>
      rowMatches(content.matrix, option.asset) &&
      colMatches(content.matrix, option.asset)
  );
}
