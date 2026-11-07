import { AGE_BANDS, type AgeBand } from "#src/contracts/types";
import { PAIR_CAP_BY_BAND } from "#src/templates/GT-020/template";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

function getPairCount(ageBand: AgeBand): number {
  const base = { "3-4": 2, "4-5": 3, "5-6": 4 }[ageBand];
  return Math.min(base, PAIR_CAP_BY_BAND[ageBand]);
}

export const GT020Generator: LevelGenerator = {
  engine: "GT-020",
  axes: {
    age_band: [...AGE_BANDS],
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
