import { getNouns, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT010Generator: LevelGenerator = {
  engine: "GT-010",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["equation", "substitution", "logic"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, 2);

    const valA = 2 + rng.nextInt(4); // 2..5
    const valB = 1 + rng.nextInt(4); // 1..4

    const symA = {
      symbol_id: "sym_1",
      asset: { kind: "emoji" as const, ref: sampled[0]?.emoji_ref },
    };
    const symB = {
      symbol_id: "sym_2",
      asset: { kind: "emoji" as const, ref: sampled[1]?.emoji_ref },
    };

    const equations = [
      { equation_id: "eq_1", left: ["sym_1", "sym_1"], right_value: valA * 2 },
      {
        equation_id: "eq_2",
        left: ["sym_1", "sym_2"],
        right_value: valA + valB,
      },
    ];

    const options = [
      { value: valB, is_correct: true },
      { value: valB + 1, is_correct: false },
      { value: valB > 1 ? valB - 1 : valB + 2, is_correct: false },
      { value: valA, is_correct: false },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy tính xem hình sau có giá trị bằng bao nhiêu nhé!",
        symbols: [symA, symB],
        equations,
        question: { kind: "value" as const, symbol_id: "sym_2" },
        options,
      },
      difficulty_params: {
        equation_count: 2,
        step_count: 2,
        distractor_count: 3,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
