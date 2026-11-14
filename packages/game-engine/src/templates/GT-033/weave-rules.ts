import {
  findConstraintViolations,
  hasUniqueSolution,
  isSudokuCompleteAndValid,
  type SudokuCell,
  type SudokuGrid,
} from "#src/systems/constraint-system";

export interface WeavePlacementCheck {
  readonly isCorrect: boolean;
  readonly rowValid: boolean;
  readonly colValid: boolean;
  readonly brokenRowIndex: number | null;
  readonly brokenColIndex: number | null;
}

function isWeavePairConsistent(
  a: string,
  b: string,
  dist: number,
  period: number
): boolean {
  return dist % period === 0 ? a === b : a !== b;
}

function toSudokuGrid(
  size: number,
  cells: readonly (string | null)[]
): SudokuGrid<string> {
  const sudokuCells: SudokuCell<string>[] = [];
  for (let i = 0; i < cells.length; i++) {
    sudokuCells.push({
      row: Math.floor(i / size),
      col: i % size,
      value: cells[i] ?? null,
    });
  }
  return { size, cells: sudokuCells, regions: "row_col" };
}

function isLatinSquareWeave(
  rows: number,
  cols: number,
  period: number
): boolean {
  return rows === cols && period === rows;
}

export function isWeaveLineValid(
  line: readonly (string | null)[],
  period: number
): boolean {
  if (period < 2) {
    return false;
  }
  for (let i = 0; i < line.length; i++) {
    const a = line[i];
    if (!a) {
      continue;
    }
    for (let j = i + 1; j < line.length; j++) {
      const b = line[j];
      if (b && !isWeavePairConsistent(a, b, j - i, period)) {
        return false;
      }
    }
  }
  return true;
}

export function extractWeaveRow(
  cells: readonly (string | null)[],
  cols: number,
  row: number
): (string | null)[] {
  const line: (string | null)[] = [];
  for (let c = 0; c < cols; c++) {
    line.push(cells[row * cols + c] ?? null);
  }
  return line;
}

export function extractWeaveCol(
  cells: readonly (string | null)[],
  rows: number,
  cols: number,
  col: number
): (string | null)[] {
  const line: (string | null)[] = [];
  for (let r = 0; r < rows; r++) {
    line.push(cells[r * cols + col] ?? null);
  }
  return line;
}

export function areWeaveCellsValid(
  rows: number,
  cols: number,
  cells: readonly (string | null)[],
  period: number
): boolean {
  if (cells.length !== rows * cols || period < 2) {
    return false;
  }
  if (isLatinSquareWeave(rows, cols, period)) {
    return findConstraintViolations(toSudokuGrid(rows, cells)).length === 0;
  }
  for (let r = 0; r < rows; r++) {
    if (!isWeaveLineValid(extractWeaveRow(cells, cols, r), period)) {
      return false;
    }
  }
  for (let c = 0; c < cols; c++) {
    if (!isWeaveLineValid(extractWeaveCol(cells, rows, cols, c), period)) {
      return false;
    }
  }
  return true;
}

export function isWeaveBoardComplete(
  rows: number,
  cols: number,
  cells: readonly (string | null)[],
  paletteIds: readonly string[]
): boolean {
  const period = paletteIds.length;
  if (isLatinSquareWeave(rows, cols, period)) {
    return isSudokuCompleteAndValid(toSudokuGrid(rows, cells));
  }
  return (
    cells.length === rows * cols &&
    cells.every((c) => c !== null) &&
    areWeaveCellsValid(rows, cols, cells, period)
  );
}

function isWeavePlacementValid(
  board: readonly (string | null)[],
  rows: number,
  cols: number,
  cellIdx: number,
  period: number
): boolean {
  const r = Math.floor(cellIdx / cols);
  const c = cellIdx % cols;
  return (
    isWeaveLineValid(extractWeaveRow(board, cols, r), period) &&
    isWeaveLineValid(extractWeaveCol(board, rows, cols, c), period)
  );
}

export function solveWeaveGrid(
  rows: number,
  cols: number,
  paletteIds: readonly string[],
  cells: readonly (string | null)[],
  maxSolutions = 2
): string[][] {
  const period = paletteIds.length;
  if (!areWeaveCellsValid(rows, cols, cells, period)) {
    return [];
  }
  const board: (string | null)[] = [...cells];
  const blanks: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      blanks.push(i);
    }
  }

  const solutions: string[][] = [];
  const backtrack = (blankIdx: number): void => {
    if (solutions.length >= maxSolutions) {
      return;
    }
    const cellIdx = blanks[blankIdx];
    if (cellIdx === undefined) {
      solutions.push(board.map((c) => c ?? ""));
      return;
    }
    for (const colorId of paletteIds) {
      board[cellIdx] = colorId;
      if (isWeavePlacementValid(board, rows, cols, cellIdx, period)) {
        backtrack(blankIdx + 1);
      }
    }
    board[cellIdx] = null;
  };

  backtrack(0);
  return solutions;
}

export function hasUniqueWeaveSolution(
  rows: number,
  cols: number,
  paletteIds: readonly string[],
  cells: readonly (string | null)[]
): boolean {
  const period = paletteIds.length;
  if (isLatinSquareWeave(rows, cols, period)) {
    return hasUniqueSolution(toSudokuGrid(rows, cells), paletteIds);
  }
  return solveWeaveGrid(rows, cols, paletteIds, cells, 2).length === 1;
}

export function evaluateWeavePlacement(
  board: readonly (string | null)[],
  rows: number,
  cols: number,
  period: number,
  cellIndex: number,
  colorId: string,
  expectedColor: string | null
): WeavePlacementCheck {
  const row = Math.floor(cellIndex / cols);
  const col = cellIndex % cols;
  const candidate = [...board];
  candidate[cellIndex] = colorId;

  const rowValid = isWeaveLineValid(
    extractWeaveRow(candidate, cols, row),
    period
  );
  const colValid = isWeaveLineValid(
    extractWeaveCol(candidate, rows, cols, col),
    period
  );
  const isCellCorrect = expectedColor !== null && colorId === expectedColor;
  const isCorrect = rowValid && colValid && isCellCorrect;

  let brokenRowIndex = rowValid ? null : row;
  let brokenColIndex = colValid ? null : col;
  if (!isCorrect && brokenRowIndex === null && brokenColIndex === null) {
    brokenRowIndex = row;
    brokenColIndex = col;
  }

  return {
    isCorrect,
    rowValid,
    colValid,
    brokenRowIndex,
    brokenColIndex,
  };
}

function spansMultipleAxes(
  cells: readonly (string | null)[],
  cols: number
): boolean {
  const rows = new Set<number>();
  const colSet = new Set<number>();
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === null) {
      rows.add(Math.floor(i / cols));
      colSet.add(i % cols);
    }
  }
  return rows.size >= 2 && colSet.size >= 2;
}

function maskBlankCandidate(
  solutionCells: readonly string[],
  targetBlanks: number,
  seedBase: number,
  shift: number
): (string | null)[] {
  const total = solutionCells.length;
  const candidate: (string | null)[] = [...solutionCells];
  const step = 1 + ((seedBase + shift) % Math.max(1, total - 1));
  let idx = (seedBase + shift) % total;
  let removed = 0;
  for (let guard = 0; guard < total * 2 && removed < targetBlanks; guard++) {
    if (candidate[idx] !== null) {
      candidate[idx] = null;
      removed++;
    }
    idx = (idx + step + (guard % 2)) % total;
  }
  return candidate;
}

export function buildReplayInitialCells(
  solutionCells: readonly string[],
  baseInitialCells: readonly (string | null)[],
  rows: number,
  cols: number,
  paletteIds: readonly string[],
  generation: number,
  layoutSeed = 0
): (string | null)[] {
  const total = rows * cols;
  if (generation <= 0 || solutionCells.length !== total) {
    return [...baseInitialCells];
  }
  const targetBlanks = Math.max(
    1,
    baseInitialCells.filter((c) => c === null).length
  );
  const requireMultiAxis = targetBlanks >= 2 && rows >= 2 && cols >= 2;
  const seedBase = Math.abs(generation * 131 + layoutSeed);

  for (let pass = 0; pass < 2; pass++) {
    const checkMultiAxis = pass === 0 && requireMultiAxis;
    for (let shift = 0; shift < total * 2; shift++) {
      const candidate = maskBlankCandidate(
        solutionCells,
        targetBlanks,
        seedBase,
        shift
      );
      const diffFromBase = candidate.some(
        (cell, i) => (cell === null) !== (baseInitialCells[i] === null)
      );
      if (
        diffFromBase &&
        (!checkMultiAxis || spansMultipleAxes(candidate, cols)) &&
        hasUniqueWeaveSolution(rows, cols, paletteIds, candidate)
      ) {
        return candidate;
      }
    }
  }
  return [...baseInitialCells];
}
