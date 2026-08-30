/**
 * `constraintSystem` — kiểm tra ràng buộc lưới không lặp (hàng, cột, vùng 2×2)
 * và đếm số nghiệm của lưới Sudoku mini (2×2, 3×3, 4×4).
 * Mục 7.4 của [`montessori-template-batch.md`](../../../../docs/specs/01-platform/montessori-template-batch.md).
 *
 * System này **độc lập với khuôn** (`BR-MTB-15`): nhận dữ liệu thuần `SudokuGrid<T>`
 * và không phụ thuộc vào Zod hay bất kỳ file nào trong `templates/`.
 *
 * Kiểm soát lỗi tự thân: ô vừa đặt có giá trị trùng lặp sẽ sáng lên cùng lúc
 * với ô xung đột trong hàng, cột hoặc vùng mà không cần báo đỏ.
 */

export type SudokuRegionMode = "row_col" | "row_col_box";

export interface SudokuCell<T = string> {
  readonly row: number;
  readonly col: number;
  readonly value: T | null;
}

export interface SudokuGrid<T = string> {
  readonly size: number;
  readonly cells: readonly SudokuCell<T>[];
  readonly regions?: SudokuRegionMode;
}

export interface ConstraintViolation {
  readonly row: number;
  readonly col: number;
  readonly conflictingWith: {
    readonly row: number;
    readonly col: number;
  };
  readonly kind: "row" | "col" | "box";
}

/** Trả về box index cho lưới 4×4 chia 2×2 (0: top-left, 1: top-right, 2: bottom-left, 3: bottom-right). */
export function get2x2BoxIndex(row: number, col: number): number {
  const boxRow = Math.floor(row / 2);
  const boxCol = Math.floor(col / 2);
  return boxRow * 2 + boxCol;
}

/** Lấy ô tại toạ độ (row, col). */
export function getCellAt<T>(
  grid: SudokuGrid<T>,
  row: number,
  col: number
): SudokuCell<T> | undefined {
  return grid.cells.find((c) => c.row === row && c.col === col);
}

/** Lấy ma trận 2 chiều (size × size) từ danh sách ô. */
export function toMatrix<T>(grid: SudokuGrid<T>): (T | null)[][] {
  const matrix: (T | null)[][] = Array.from({ length: grid.size }, () =>
    new Array(grid.size).fill(null)
  );
  for (const cell of grid.cells) {
    if (
      cell.row >= 0 &&
      cell.row < grid.size &&
      cell.col >= 0 &&
      cell.col < grid.size
    ) {
      const row = matrix[cell.row];
      if (row) {
        row[cell.col] = cell.value;
      }
    }
  }
  return matrix;
}

function checkRowViolations<T>(
  r: number,
  row: (T | null)[],
  size: number,
  violations: ConstraintViolation[]
): void {
  for (let c1 = 0; c1 < size; c1++) {
    const val1 = row[c1];
    if (val1 === null || val1 === undefined) {
      continue;
    }
    for (let c2 = c1 + 1; c2 < size; c2++) {
      if (row[c2] === val1) {
        violations.push({
          row: r,
          col: c1,
          conflictingWith: { row: r, col: c2 },
          kind: "row",
        });
        violations.push({
          row: r,
          col: c2,
          conflictingWith: { row: r, col: c1 },
          kind: "row",
        });
      }
    }
  }
}

function findRowViolations<T>(
  matrix: (T | null)[][],
  size: number
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  for (let r = 0; r < size; r++) {
    const row = matrix[r];
    if (row) {
      checkRowViolations(r, row, size, violations);
    }
  }
  return violations;
}

function checkColViolations<T>(
  c: number,
  matrix: (T | null)[][],
  size: number,
  violations: ConstraintViolation[]
): void {
  for (let r1 = 0; r1 < size; r1++) {
    const val1 = matrix[r1]?.[c];
    if (val1 === null || val1 === undefined) {
      continue;
    }
    for (let r2 = r1 + 1; r2 < size; r2++) {
      if (matrix[r2]?.[c] === val1) {
        violations.push({
          row: r1,
          col: c,
          conflictingWith: { row: r2, col: c },
          kind: "col",
        });
        violations.push({
          row: r2,
          col: c,
          conflictingWith: { row: r1, col: c },
          kind: "col",
        });
      }
    }
  }
}

function findColViolations<T>(
  matrix: (T | null)[][],
  size: number
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  for (let c = 0; c < size; c++) {
    checkColViolations(c, matrix, size, violations);
  }
  return violations;
}

function collectBoxCells<T>(
  matrix: (T | null)[][],
  box: number
): Array<{ row: number; col: number; val: T }> {
  const boxRowStart = Math.floor(box / 2) * 2;
  const boxColStart = (box % 2) * 2;
  const cells: Array<{ row: number; col: number; val: T }> = [];
  for (let dr = 0; dr < 2; dr++) {
    for (let dc = 0; dc < 2; dc++) {
      const r = boxRowStart + dr;
      const c = boxColStart + dc;
      const row = matrix[r];
      const val = row?.[c];
      if (val !== null && val !== undefined) {
        cells.push({ row: r, col: c, val });
      }
    }
  }
  return cells;
}

function checkCellPairInBox<T>(
  c1: { row: number; col: number; val: T },
  c2: { row: number; col: number; val: T },
  violations: ConstraintViolation[]
): void {
  if (c1.val !== c2.val) {
    return;
  }
  if (c1.row === c2.row || c1.col === c2.col) {
    return;
  }
  violations.push({
    row: c1.row,
    col: c1.col,
    conflictingWith: { row: c2.row, col: c2.col },
    kind: "box",
  });
  violations.push({
    row: c2.row,
    col: c2.col,
    conflictingWith: { row: c1.row, col: c1.col },
    kind: "box",
  });
}

function checkPairsInBox<T>(
  cells: Array<{ row: number; col: number; val: T }>,
  violations: ConstraintViolation[]
): void {
  for (let i = 0; i < cells.length; i++) {
    const c1 = cells[i];
    if (!c1) {
      continue;
    }
    for (let j = i + 1; j < cells.length; j++) {
      const c2 = cells[j];
      if (c2) {
        checkCellPairInBox(c1, c2, violations);
      }
    }
  }
}

function findBoxViolations<T>(matrix: (T | null)[][]): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  for (let box = 0; box < 4; box++) {
    const boxCells = collectBoxCells(matrix, box);
    checkPairsInBox(boxCells, violations);
  }
  return violations;
}

/**
 * Tìm mọi vi phạm ràng buộc (trùng lặp giá trị non-null trong hàng, cột, hoặc vùng).
 */
export function findConstraintViolations<T>(
  grid: SudokuGrid<T>
): readonly ConstraintViolation[] {
  const { size, regions = "row_col" } = grid;
  const matrix = toMatrix(grid);

  const rowViolations = findRowViolations(matrix, size);
  const colViolations = findColColViolations(matrix, size);
  const boxViolations =
    size === 4 && regions === "row_col_box" ? findBoxViolations(matrix) : [];

  return [...rowViolations, ...colViolations, ...boxViolations];
}

function findColColViolations<T>(
  matrix: (T | null)[][],
  size: number
): ConstraintViolation[] {
  return findColViolations(matrix, size);
}

function checkRowColConflict<T>(
  matrix: (T | null)[][],
  size: number,
  row: number,
  col: number,
  val: T
): boolean {
  const rRow = matrix[row];
  for (let c = 0; c < size; c++) {
    if (c !== col && rRow?.[c] === val) {
      return true;
    }
  }
  for (let r = 0; r < size; r++) {
    if (r !== row && matrix[r]?.[col] === val) {
      return true;
    }
  }
  return false;
}

function checkBoxConflict<T>(
  matrix: (T | null)[][],
  row: number,
  col: number,
  val: T
): boolean {
  const boxRowStart = Math.floor(row / 2) * 2;
  const boxColStart = Math.floor(col / 2) * 2;
  for (let r = boxRowStart; r < boxRowStart + 2; r++) {
    for (let c = boxColStart; c < boxColStart + 2; c++) {
      if ((r !== row || c !== col) && matrix[r]?.[c] === val) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Kiểm tra xem một giá trị `val` có thể đặt vào (row, col) trên `matrix` mà không phạm quy không.
 */
function isValidPlacement<T>(
  matrix: (T | null)[][],
  size: number,
  regions: SudokuRegionMode,
  row: number,
  col: number,
  val: T
): boolean {
  if (checkRowColConflict(matrix, size, row, col, val)) {
    return false;
  }
  if (
    size === 4 &&
    regions === "row_col_box" &&
    checkBoxConflict(matrix, row, col, val)
  ) {
    return false;
  }
  return true;
}

/**
 * Đếm số nghiệm của lưới (dừng ngay khi vượt maxCount).
 */
export function countSudokuSolutions<T>(
  grid: SudokuGrid<T>,
  possibleValues: readonly T[],
  maxCount = 2
): number {
  const { size, regions = "row_col" } = grid;
  if (findConstraintViolations(grid).length > 0) {
    return 0;
  }

  const matrix = toMatrix(grid);
  let count = 0;

  function trySingleValue(
    r: number,
    c: number,
    val: T,
    nextR: number,
    nextC: number
  ): void {
    if (!isValidPlacement(matrix, size, regions, r, c, val)) {
      return;
    }
    const row = matrix[r];
    if (row) {
      row[c] = val;
    }
    solveCell(nextR, nextC);
    if (row) {
      row[c] = null;
    }
  }

  function tryValuesAt(
    r: number,
    c: number,
    nextR: number,
    nextC: number
  ): void {
    for (const val of possibleValues) {
      trySingleValue(r, c, val, nextR, nextC);
      if (count >= maxCount) {
        return;
      }
    }
  }

  function solveCell(r: number, c: number): void {
    if (count >= maxCount) {
      return;
    }
    if (r === size) {
      count++;
      return;
    }

    const nextR = c + 1 === size ? r + 1 : r;
    const nextC = c + 1 === size ? 0 : c + 1;

    const row = matrix[r];
    if (row && row[c] !== null) {
      solveCell(nextR, nextC);
      return;
    }

    tryValuesAt(r, c, nextR, nextC);
  }

  solveCell(0, 0);
  return count;
}

/** Kiểm tra lưới có đúng 1 nghiệm duy nhất hay không. */
export function hasUniqueSolution<T>(
  grid: SudokuGrid<T>,
  possibleValues: readonly T[]
): boolean {
  return countSudokuSolutions(grid, possibleValues, 2) === 1;
}

/** Kiểm tra lưới đã điền kín và không có vi phạm nào. */
export function isSudokuCompleteAndValid<T>(grid: SudokuGrid<T>): boolean {
  if (grid.cells.length !== grid.size * grid.size) {
    return false;
  }
  if (grid.cells.some((c) => c.value === null)) {
    return false;
  }
  return findConstraintViolations(grid).length === 0;
}
