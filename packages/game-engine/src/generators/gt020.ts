import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

function getPairCount(ageBand: string): number {
  if (ageBand === "3-4") {
    return 2;
  }
  if (ageBand === "4-5") {
    return 3;
  }
  return 4;
}

export const GT020Generator: LevelGenerator = {
  engine: "GT-020",
  axes: {
    age_band: ["3-4", "4-5", "5-6"],
    what: ["memory", "card-flip", "matching"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 8);
    const pairCount = getPairCount(age_band);
    const sampled = sampleUnique(rng, nouns, pairCount);

    const pairs = sampled.map((item, idx) => ({
      pair_key: `key_${idx + 1}`,
      card_a: {
        card_id: `card_${idx + 1}_a`,
        asset: { kind: "emoji" as const, ref: item?.emoji_ref || "🍎" },
      },
      card_b: {
        card_id: `card_${idx + 1}_b`,
        asset: { kind: "emoji" as const, ref: item?.emoji_ref || "🍎" },
      },
    }));

    return {
      content_pack: {
        prompt: "Bé hãy lật thẻ và tìm các cặp hình giống nhau nhé!",
        pairs,
      },
      difficulty_params: {
        flip_back_delay_ms: 1200,
        peek_all_initial_ms: 0,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
