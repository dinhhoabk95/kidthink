import { shuffle } from "#src/rng/shuffle";
import {
  hasUniqueSolution,
  type SudokuGrid,
} from "#src/systems/constraint-system";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const GRID_SIZE = 3;
const MAX_ATTEMPTS = 500;
const HINT_AFTER_MS_BY_BLANKS: Record<number, number> = {
  2: 12_000,
  3: 15_000,
};

interface Blank {
  row: number;
  col: number;
}

/** Có ô trống khác cùng hàng hoặc cùng cột: trẻ phải đọc cả hai chiều chứ không chỉ một hàng. */
function hasLinkedBlanks(blanks: readonly Blank[]): boolean {
  return blanks.some((a) =>
    blanks.some((b) => b !== a && (a.row === b.row || a.col === b.col))
  );
}

/**
 * Lưới 3×3 từ hình vuông Latin hoán vị hàng/cột/ký hiệu, rồi bỏ 2–3 ô ngẫu
 * nhiều lần tới khi đề đạt `BR-E015-06`: nghiệm duy nhất (bộ giải đo, không
 * tin), các ô trống không cùng một đáp án, và có ô trống liên kết hàng/cột.
 * Bản cũ ghim ba ô trống trên đường chéo phụ, ô nào cũng chỉ cần nhìn một hàng
 * và cả ba cùng một đáp án; 2×2 thì hai ô trống cùng đáp án. Band 5-6 duy nhất:
 * `age_min` của engine là 5.
 */
export const GT015Generator: LevelGenerator = {
  engine: "GT-015",
  axes: {
    age_band: ["5-6"],
    what: ["logic", "pattern", "constraint", "matrix"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, GRID_SIZE);
    const symbols = sampled.map((n, idx) => ({
      symbol_id: `sym_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: n.emoji_ref },
    }));
    const symbolIds = symbols.map((s) => s.symbol_id);

    const order = Array.from({ length: GRID_SIZE }, (_, i) => i);
    const rowOrder = shuffle(order, rng);
    const colOrder = shuffle(order, rng);
    const solved = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
      const row = Math.floor(index / GRID_SIZE);
      const col = index % GRID_SIZE;
      const symbolIndex =
        ((rowOrder[row] ?? 0) + (colOrder[col] ?? 0)) % GRID_SIZE;
      return { row, col, symbol_id: symbolIds[symbolIndex] ?? "sym_1" };
    });

    const blankCount = 2 + rng.nextInt(2);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const picked = shuffle(solved, rng).slice(0, blankCount);
      const blanks: Blank[] = picked.map(({ row, col }) => ({ row, col }));
      const answers = new Set(picked.map((c) => c.symbol_id));
      if (answers.size < 2 || !hasLinkedBlanks(blanks)) {
        continue;
      }
      const cells: Array<{
        row: number;
        col: number;
        symbol_id: string | null;
      }> = solved.map((c) =>
        blanks.some((b) => b.row === c.row && b.col === c.col)
          ? { row: c.row, col: c.col, symbol_id: null }
          : c
      );
      const grid: SudokuGrid<string> = {
        size: GRID_SIZE,
        regions: "row_col",
        cells: cells.map((c) => ({
          row: c.row,
          col: c.col,
          value: c.symbol_id,
        })),
      };
      if (!hasUniqueSolution(grid, symbolIds)) {
        continue;
      }
      return {
        content_pack: {
          prompt:
            "Bé hãy điền hình thích hợp vào ô trống để mỗi hàng và cột không bị trùng nhé!",
          grid_size: GRID_SIZE,
          symbols,
          cells,
          regions: "row_col" as const,
        },
        difficulty_params: {
          item_count: GRID_SIZE,
          blank_count: blankCount,
          hint_after_ms: HINT_AFTER_MS_BY_BLANKS[blankCount] ?? 15_000,
          allow_retry: true,
        },
      };
    }
    throw new Error(
      `GT-015: không dựng được lưới ${GRID_SIZE}×${GRID_SIZE} ${blankCount} ô trống đạt BR-E015-06 sau ${MAX_ATTEMPTS} lần`
    );
  },
};
