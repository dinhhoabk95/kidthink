import { getNouns, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT006Generator: LevelGenerator = {
  engine: "GT-006",
  axes: {
    age_band: ["5-6"],
    what: ["ordering", "sequence"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const stepCount = 3;
    const sampled = sampleUnique(rng, nouns, stepCount);

    const sequence = sampled.map((item, idx) => ({
      step_id: `step_${idx + 1}`,
      order_index: idx,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
      label: item.label_vi,
    }));

    return {
      content_pack: {
        prompt: "Bé hãy xếp các thẻ theo đúng thứ tự nhé!",
        sequence,
      },
      difficulty_params: {
        hint_after_ms: 15_000,
        allow_retry: true,
        shuffle_initial: true,
      },
    };
  },
};
