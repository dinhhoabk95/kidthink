import { getNouns, pickOne, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

function getOptionCount(ageBand: string): number {
  if (ageBand === "3-4") {
    return 3;
  }
  if (ageBand === "4-5") {
    return 4;
  }
  return 5;
}

export const GT001Generator: LevelGenerator = {
  engine: "GT-001",
  axes: {
    age_band: ["3-4", "4-5", "5-6"],
    what: ["classification", "observation", "number"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const optionCount = getOptionCount(age_band);
    const sampled = sampleUnique(rng, nouns, optionCount);
    const target = pickOne(rng, sampled);

    const targetItem = {
      item_id: `item_${target.emoji_ref}`,
      asset: { kind: "emoji" as const, ref: target.emoji_ref },
    };

    const options = sampled.map((item, idx) => ({
      item_id: `opt_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
      is_correct: item.emoji_ref === target.emoji_ref,
    }));

    return {
      content_pack: {
        prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
        target_item: targetItem,
        options,
      },
      difficulty_params: {
        distractor_count: optionCount - 1,
        hint_after_ms: age_band === "3-4" ? 10_000 : 15_000,
        allow_retry: true,
        shuffle_items: true,
      },
    };
  },
};
