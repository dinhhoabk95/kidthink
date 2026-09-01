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
      // 2x2 grid:
      // (0,0)=s1, (0,1)=s2
      // (1,0)=s2, (1,1)=null (đáp án là s1)
      cells = [
        { row: 0, col: 0, symbol_id: s1 },
        { row: 0, col: 1, symbol_id: s2 },
        { row: 1, col: 0, symbol_id: s2 },
        { row: 1, col: 1, symbol_id: null },
      ];
    } else {
      // 3x3 grid:
      // s1 s2 s3
      // s2 s3 s1
      // s3 s1 null (đáp án là s2)
      const s3 = symbols[2]?.symbol_id ?? "sym_3";
      cells = [
        { row: 0, col: 0, symbol_id: s1 },
        { row: 0, col: 1, symbol_id: s2 },
        { row: 0, col: 2, symbol_id: s3 },
        { row: 1, col: 0, symbol_id: s2 },
        { row: 1, col: 1, symbol_id: s3 },
        { row: 1, col: 2, symbol_id: s1 },
        { row: 2, col: 0, symbol_id: s3 },
        { row: 2, col: 1, symbol_id: s1 },
        { row: 2, col: 2, symbol_id: null },
      ];
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
        empty_cell_count: 1,
        hint_after_ms: age_band === "4-5" ? 10_000 : 15_000,
        allow_retry: true,
      },
    };
  },
};
