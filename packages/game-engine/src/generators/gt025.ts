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

    const positions = [
      { x: 100, y: 150 },
      { x: 250, y: 200 },
    ];
    const diffIdx = rng.nextInt(positions.length);
    const shared = sampled[1];
    const left_objects = positions.map((pos, i) => ({
      id: `left_${i + 1}`,
      asset: {
        kind: "emoji" as const,
        ref: (i === diffIdx ? sampled[0] : shared)?.emoji_ref,
      },
      ...pos,
    }));
    const right_objects = positions.map((pos, i) => ({
      id: `right_${i + 1}`,
      asset: {
        kind: "emoji" as const,
        ref: (i === diffIdx ? sampled[2] : shared)?.emoji_ref,
      },
      ...pos,
    }));

    const differences = [
      {
        id: "diff_1",
        left_id: `left_${diffIdx + 1}`,
        right_id: `right_${diffIdx + 1}`,
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
        item_count: 2,
        hint_after_ms: 8000,
        allow_retry: true,
        show_counter: true,
      },
    };
  },
};
