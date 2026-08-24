import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";
import {
  hasUniqueSolution,
  type SudokuGrid,
} from "#src/systems/constraint-system";

const symbolItemSchema = () =>
  z.object({
    symbol_id: z.string().min(1).max(32),
    asset: assetSchema(),
  });

const gridCellSchema = () =>
  z.object({
    row: z.number().int().min(0).max(3),
    col: z.number().int().min(0).max(3),
    symbol_id: z.string().min(1).max(32).nullable(),
  });

export const GT015BaseSchema = z.object({
  ...promptFields(),
  grid_size: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  symbols: z.array(symbolItemSchema()).min(2).max(4),
  cells: z.array(gridCellSchema()).min(4).max(16),
  regions: z.enum(["row_col", "row_col_box"]).default("row_col"),
});

type GT015Shape = z.infer<typeof GT015BaseSchema>;

function validateGridGeometry(content: GT015Shape): boolean {
  const { grid_size, symbols, cells } = content;
  if (symbols.length !== grid_size) {
    return false;
  }
  if (cells.length !== grid_size * grid_size) {
    return false;
  }

  const validSymbolIds = new Set(symbols.map((s) => s.symbol_id));
  const seenCoords = new Set<string>();

  for (const c of cells) {
    if (c.row < 0 || c.row >= grid_size || c.col < 0 || c.col >= grid_size) {
      return false;
    }
    const key = `${c.row},${c.col}`;
    if (seenCoords.has(key)) {
      return false;
    }
    seenCoords.add(key);

    if (c.symbol_id !== null && !validSymbolIds.has(c.symbol_id)) {
      return false;
    }
  }

  // Phải có ít nhất 1 ô trống để bé giải
  const blanks = cells.filter((c) => c.symbol_id === null);
  if (blanks.length === 0) {
    return false;
  }

  return true;
}

export const GT015ContentSchema = GT015BaseSchema.refine(validateGridGeometry, {
  message:
    "Số biểu tượng phải bằng grid_size, danh sách ô phải đủ size×size toạ độ hợp lệ, và phải có ít nhất 1 ô trống.",
  path: ["cells"],
}).refine(
  (content) => {
    const grid: SudokuGrid<string> = {
      size: content.grid_size,
      regions: content.regions,
      cells: content.cells.map((c) => ({
        row: c.row,
        col: c.col,
        value: c.symbol_id,
      })),
    };
    const possibleValues = content.symbols.map((s) => s.symbol_id);
    return hasUniqueSolution(grid, possibleValues);
  },
  {
    message:
      "Lưới Sudoku mini phải có đúng 1 nghiệm duy nhất (không thừa nghiệm, không vô nghiệm).",
    path: ["cells"],
  }
);

export const GT015DifficultySchema = z.object({
  blank_count: z.number().int().min(1).max(6),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT015Content = z.infer<typeof GT015ContentSchema>;
export type GT015Difficulty = z.infer<typeof GT015DifficultySchema>;

export default defineTemplate({
  code: "GT-015",
  name: "Lưới không lặp",
  mechanic: "sudoku-mini",
  layouts: ["matrix-slot-grid", "grid"],
  content_contract: GT015ContentSchema,
  difficulty_contract: GT015DifficultySchema,
  limits: {
    item_count: [2, 4],
    distractor_count: [0, 2],
    target_count: [1, 3],
  },
  age_min: 5,
  age_max: 6,
  requires_tap_fallback: true,
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: [
    "game_started",
    "cell_filled",
    "constraint_violated",
    "game_completed",
  ],
  engine_session: "SudokuMiniSession",
  status: "published",
  version: 1,
});
