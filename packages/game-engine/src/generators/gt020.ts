import { AGE_BANDS, type AgeBand } from "#src/contracts/types";
import {
  type GT020Content,
  type GT020Difficulty,
  PAIR_CAP_BY_BAND,
} from "#src/templates/GT-020/template";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

function getPairCount(ageBand: AgeBand, step = 0): number {
  const baseByBand: Record<AgeBand, number> = {
    "3-4": step >= 2 ? 3 : 2,
    "4-5": step >= 2 ? 4 : 3,
    "5-6": step >= 2 ? 5 : 4,
  };
  return Math.min(baseByBand[ageBand], PAIR_CAP_BY_BAND[ageBand]);
}

function getPeekAllInitialMs(ageBand: AgeBand): number {
  const peekByBand: Record<AgeBand, number> = {
    "3-4": 2000,
    "4-5": 1200,
    "5-6": 0,
  };
  return peekByBand[ageBand];
}

function getFlipBackDelayMs(ageBand: AgeBand): number {
  const delayByBand: Record<AgeBand, number> = {
    "3-4": 1500,
    "4-5": 1200,
    "5-6": 1000,
  };
  return delayByBand[ageBand];
}

export const GT020Generator: LevelGenerator<GT020Content, GT020Difficulty> = {
  engine: "GT-020",
  axes: {
    age_band: [...AGE_BANDS],
    what: ["memory", "card-flip", "matching"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary, escalation_step }) {
    const nouns = getNouns(vocabulary, 8);
    const pairCount = getPairCount(age_band, escalation_step ?? 0);
    const sampled = sampleUnique(rng, nouns, pairCount);

    const pairs: GT020Content["pairs"] = sampled.map((item, idx) => ({
      pair_key: `key_${idx + 1}`,
      card_a: {
        card_id: `card_${idx + 1}_a`,
        asset: { kind: "emoji", ref: item?.emoji_ref || "🍎" },
      },
      card_b: {
        card_id: `card_${idx + 1}_b`,
        asset: { kind: "emoji", ref: item?.emoji_ref || "🍎" },
      },
    }));

    return {
      content_pack: {
        prompt: "Bé hãy lật thẻ và tìm các cặp hình giống nhau nhé!",
        pairs,
      },
      difficulty_params: {
        flip_back_delay_ms: getFlipBackDelayMs(age_band),
        peek_all_initial_ms: getPeekAllInitialMs(age_band),
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
