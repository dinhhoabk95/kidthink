import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT011Generator: LevelGenerator = {
  engine: "GT-011",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["matrix", "pattern", "logic"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, 3);

    const a = { kind: "emoji" as const, ref: sampled[0]?.emoji_ref };
    const b = { kind: "emoji" as const, ref: sampled[1]?.emoji_ref };
    const c = { kind: "emoji" as const, ref: sampled[2]?.emoji_ref };

    const cells = [
      { row: 0, col: 0, asset: a },
      { row: 0, col: 1, asset: b },
      { row: 0, col: 2, asset: c },
      { row: 1, col: 0, asset: b },
      { row: 1, col: 1, asset: c },
      { row: 1, col: 2, asset: a },
      { row: 2, col: 0, asset: c },
      { row: 2, col: 1, asset: a },
      { row: 2, col: 2, asset: null },
    ];

    const options = [
      { option_id: "opt_1", asset: b, is_correct: true },
      { option_id: "opt_2", asset: a, is_correct: false },
      { option_id: "opt_3", asset: c, is_correct: false },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy chọn hình thích hợp cho ô còn trống nhé!",
        matrix: {
          rows: 3 as const,
          cols: 3 as const,
          cells,
        },
        options,
      },
      difficulty_params: {
        grid_size: 3,
        distractor_count: 2,
        hint_after_ms: 12_000,
        allow_retry: true,
      },
    };
  },
};
