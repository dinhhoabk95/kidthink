import {
  hasUniqueSolution,
  type SudokuGrid,
} from "../systems/constraint-system.js";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT015Generator: LevelGenerator = {
  engine: "GT-015",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["logic", "pattern", "constraint", "matrix"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const gridSize = age_band === "4-5" ? 2 : 3;
    const sampled = sampleUnique(rng, nouns, gridSize);

    const symbols = sampled.map((n, idx) => ({
      symbol_id: `sym_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: n.emoji_ref },
    }));

    const s1 = symbols[0]?.symbol_id ?? "sym_1";
    const s2 = symbols[1]?.symbol_id ?? "sym_2";

    let cells: Array<{ row: number; col: number; symbol_id: string | null }> =
      [];

    if (gridSize === 2) {
      // 2x2 grid: 2 ô cho sẵn trên đường chéo chính, 2 ô trống trên đường chéo phụ
      // (0,0)=s1, (0,1)=null (đáp án là s2)
      // (1,0)=null, (1,1)=s1 (đáp án là s2)
      cells = [
        { row: 0, col: 0, symbol_id: s1 },
        { row: 0, col: 1, symbol_id: null },
        { row: 1, col: 0, symbol_id: null },
        { row: 1, col: 1, symbol_id: s1 },
      ];
    } else {
      // 3x3 grid: 6 ô cho sẵn, 3 ô trống trên đường chéo phụ
      // (0,0)=s1, (0,1)=s2, (0,2)=null (đáp án là s3)
      // (1,0)=s2, (1,1)=null, (1,2)=s1 (đáp án là s3)
      // (2,0)=null, (2,1)=s1, (2,2)=s2 (đáp án là s3)
      cells = [
        { row: 0, col: 0, symbol_id: s1 },
        { row: 0, col: 1, symbol_id: s2 },
        { row: 0, col: 2, symbol_id: null },
        { row: 1, col: 0, symbol_id: s2 },
        { row: 1, col: 1, symbol_id: null },
        { row: 1, col: 2, symbol_id: s1 },
        { row: 2, col: 0, symbol_id: null },
        { row: 2, col: 1, symbol_id: s1 },
        { row: 2, col: 2, symbol_id: s2 },
      ];
    }

    const grid: SudokuGrid<string> = {
      size: gridSize,
      regions: "row_col",
      cells: cells.map((c) => ({
        row: c.row,
        col: c.col,
        value: c.symbol_id,
      })),
    };
    const possibleValues = symbols.map((s) => s.symbol_id);

    // Bộ giải kiểm tra: Lưới phải có đúng 1 nghiệm duy nhất (không thừa nghiệm, không vô nghiệm)
    if (!hasUniqueSolution(grid, possibleValues)) {
      throw new Error(
        "GT-015 solver verification failed: sudoku grid must have exactly one unique solution"
      );
    }

    return {
      content_pack: {
        prompt:
          "Bé hãy điền hình thích hợp vào ô trống để mỗi hàng và cột không bị trùng nhé!",
        grid_size: gridSize,
        symbols,
        cells,
        regions: "row_col",
      },
      difficulty_params: {
        blank_count: gridSize === 2 ? 2 : 3,
        hint_after_ms: age_band === "4-5" ? 10_000 : 15_000,
        allow_retry: true,
      },
    };
  },
};
