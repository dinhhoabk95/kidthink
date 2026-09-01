import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT025Generator: LevelGenerator = {
  engine: "GT-025",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["observation", "spot-difference", "comparison"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, 3);

    const left_objects = [
      {
        id: "left_1",
        asset: { kind: "emoji" as const, ref: sampled[0]?.emoji_ref },
        x: 100,
        y: 150,
      },
      {
        id: "left_2",
        asset: { kind: "emoji" as const, ref: sampled[1]?.emoji_ref },
        x: 250,
        y: 200,
      },
    ];

    const right_objects = [
      {
        id: "right_1",
        asset: { kind: "emoji" as const, ref: sampled[2]?.emoji_ref }, // khác biệt!
        x: 100,
        y: 150,
      },
      {
        id: "right_2",
        asset: { kind: "emoji" as const, ref: sampled[1]?.emoji_ref },
        x: 250,
        y: 200,
      },
    ];

    const differences = [
      {
        id: "diff_1",
        left_id: "left_1",
        right_id: "right_1",
        description: "Hình khác nhau",
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy tìm điểm khác biệt giữa 2 bức tranh nhé!",
        target_count: 1,
        left_objects,
        right_objects,
        differences,
      },
      difficulty_params: {
        hint_after_ms: 8000,
        allow_retry: true,
        show_counter: true,
      },
    };
  },
};
