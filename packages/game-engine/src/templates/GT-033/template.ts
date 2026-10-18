import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

const GT033PaletteItemSchema = z.object({
  color_id: z.string().min(1),
  asset: assetSchema(),
  name_vi: z.string().optional(),
});

function isWeavePairConsistent(
  a: string,
  b: string,
  dist: number,
  period: number
): boolean {
  return dist % period === 0 ? a === b : a !== b;
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
  if (cells.length !== rows * cols) {
    return false;
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

export const GT033ContentSchema = z
  .object({
    ...promptFields(),
    grid: z.object({
      rows: z.number().int().min(2).max(5),
      cols: z.number().int().min(2).max(5),
    }),
    palette: z.array(GT033PaletteItemSchema).min(2).max(4),
    cells: z.array(z.string().nullable()),
    solution: z.array(z.string()).optional(),
    row_rule: z.string().optional(),
    col_rule: z.string().optional(),
  })
  .refine((c) => c.cells.length === c.grid.rows * c.grid.cols, {
    message: "Số ô trong cells phải bằng rows * cols của lưới (BR-E033-01)",
    path: ["cells"],
  })
  .refine(
    (c) => {
      const paletteIds = new Set(c.palette.map((p) => p.color_id));
      return c.cells.every((cell) => cell === null || paletteIds.has(cell));
    },
    {
      message: "Mọi màu trong cells phải tồn tại trong bảng palette",
      path: ["cells"],
    }
  )
  .refine(
    (c) => {
      const hasNull = c.cells.some((cell) => cell === null);
      return hasNull;
    },
    {
      message: "Phải có ít nhất 1 ô trống (null) để trẻ điền",
      path: ["cells"],
    }
  )
  .refine(
    (c) => {
      if (c.cells.length !== c.grid.rows * c.grid.cols) {
        return true;
      }
      return areWeaveCellsValid(
        c.grid.rows,
        c.grid.cols,
        c.cells,
        c.palette.length
      );
    },
    {
      message:
        "BR-E033-02: dữ liệu ô trong cells vi phạm quy luật hàng hoặc cột",
      path: ["cells"],
    }
  )
  .refine(
    (c) => {
      if (c.cells.length !== c.grid.rows * c.grid.cols) {
        return true;
      }
      const paletteIds = c.palette.map((p) => p.color_id);
      if (
        !areWeaveCellsValid(
          c.grid.rows,
          c.grid.cols,
          c.cells,
          paletteIds.length
        )
      ) {
        return true;
      }
      if (!c.cells.some((cell) => cell === null)) {
        return true;
      }
      const solutions = solveWeaveGrid(
        c.grid.rows,
        c.grid.cols,
        paletteIds,
        c.cells,
        2
      );
      return solutions.length === 1;
    },
    {
      message:
        "BR-E033-01: lưới phải có đúng một lời giải thoả quy luật hàng và cột",
      path: ["cells"],
    }
  );

export const GT033DifficultySchema = z.object({
  item_count: z.number().int().min(2).max(4),
  grid_size: z.number().int().min(2).max(5).default(3),
  color_count: z.number().int().min(2).max(4).default(2),
  blank_count: z.number().int().min(1).max(12).default(2),
  allow_retry: z.boolean().default(true),
  hint_after_ms: z.number().int().min(1000).default(8000),
});

export type GT033PaletteItem = z.infer<typeof GT033PaletteItemSchema>;
export type GT033Content = z.infer<typeof GT033ContentSchema>;
export type GT033Difficulty = z.infer<typeof GT033DifficultySchema>;

export default defineTemplate({
  code: "GT-033",
  name: "Dệt hoa văn lưới",
  mechanic: "weave-grid",
  status: "published",
  version: 1,
  engine_session: "GT033Session",
  layouts: ["weave-grid"],
  content_contract: GT033ContentSchema,
  difficulty_contract: GT033DifficultySchema,
  age_min: 5,
  age_max: 6,
  banned_age_bands: ["3-4", "4-5"],
  requires_tap_fallback: true,
  limits: {
    item_count: [2, 4],
    distractor_count: [0, 0],
    target_count: [4, 25],
  },
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  input: {
    family: "tap",
    verbs: ["tap"],
    tolerance_px: 24,
  },
  events: ["game_started", "yarn_placed", "yarn_removed", "game_completed"],
});
