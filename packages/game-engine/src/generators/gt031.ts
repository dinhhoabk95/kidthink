import {
  canFormTargetAmount,
  type GT031Content,
  type GT031Difficulty,
} from "#src/templates/GT-031/template";
import {
  getNouns,
  pickOne,
  sampleUnique,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const BASE_DENOMINATIONS = [1, 2, 5];
const FULL_DENOMINATIONS = [1, 2, 5, 10];
const MAX_TRAY_COINS = 8;

interface EscalationProfile {
  denominations: readonly number[];
  solutionCount: number;
  distractorCount: number;
  hintAfterMs: number;
}

function resolveProfile(
  escalationStep: number | undefined,
  nextInt: (n: number) => number
): EscalationProfile {
  const step = Math.max(0, escalationStep ?? 0);
  if (step === 0) {
    return {
      denominations: BASE_DENOMINATIONS,
      solutionCount: 2,
      distractorCount: 1,
      hintAfterMs: 8000,
    };
  }
  if (step === 1) {
    return {
      denominations: BASE_DENOMINATIONS,
      solutionCount: 3,
      distractorCount: 2,
      hintAfterMs: 8000,
    };
  }
  if (step === 2) {
    return {
      denominations: FULL_DENOMINATIONS,
      solutionCount: 3 + nextInt(2),
      distractorCount: 2,
      hintAfterMs: 10_000,
    };
  }
  return {
    denominations: FULL_DENOMINATIONS,
    solutionCount: 4,
    distractorCount: 2 + nextInt(2),
    hintAfterMs: 12_000,
  };
}

export const GT031Generator: LevelGenerator<GT031Content, GT031Difficulty> = {
  engine: "GT-031",
  axes: {
    age_band: ["5-6"],
    what: ["money", "number", "quantity"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band: _age_band, vocabulary, escalation_step }) {
    const nouns = getNouns(vocabulary, 2);
    const itemNoun = pickOne(rng, nouns);
    const profile = resolveProfile(escalation_step, (n) => rng.nextInt(n));

    const solutionValues: number[] = [];
    for (let i = 0; i < profile.solutionCount; i++) {
      const idx = rng.nextInt(profile.denominations.length);
      solutionValues.push(profile.denominations[idx] ?? 1);
    }

    // Đảm bảo ít nhất 2 mệnh giá khác nhau trong lời giải
    if (new Set(solutionValues).size < 2 && profile.denominations.length >= 2) {
      const firstVal = solutionValues[0] ?? 1;
      const alt =
        profile.denominations.find((d) => d !== firstVal) ??
        profile.denominations[0] ??
        2;
      solutionValues[solutionValues.length - 1] = alt;
    }

    const targetAmount = solutionValues.reduce((acc, v) => acc + v, 0);
    const maxSolutionVal = Math.max(...solutionValues);
    const allowedDistractors = profile.denominations.filter(
      (d) => d <= maxSolutionVal && d <= targetAmount
    );
    const distractorPool =
      allowedDistractors.length > 0 ? allowedDistractors : [1];

    const cappedDistractors = Math.min(
      profile.distractorCount,
      Math.max(1, MAX_TRAY_COINS - solutionValues.length)
    );
    const allCoinValues = [...solutionValues];
    for (let i = 0; i < cappedDistractors; i++) {
      const idx = rng.nextInt(distractorPool.length);
      allCoinValues.push(distractorPool[idx] ?? 1);
    }

    const shuffledCoinValues = sampleUnique(
      rng,
      allCoinValues,
      allCoinValues.length
    );

    if (!canFormTargetAmount(shuffledCoinValues, targetAmount)) {
      throw new Error(
        "GT031Generator: generated coins cannot form target_amount"
      );
    }

    const coins = shuffledCoinValues.map((val, idx) => ({
      coin_id: `coin_${idx + 1}_val${val}`,
      asset: { kind: "emoji" as const, ref: "🪙" },
      value: val,
    }));

    return {
      content_pack: {
        prompt: `Bé hãy chọn các đồng xu để trả đúng ${targetAmount} đồng nhé!`,
        target_amount: targetAmount,
        item_to_buy: {
          label: itemNoun.label_vi,
          asset: { kind: "emoji" as const, ref: itemNoun.emoji_ref },
        },
        coins,
      },
      difficulty_params: {
        item_count: coins.length,
        coin_kind_count: new Set(shuffledCoinValues).size,
        target_amount: targetAmount,
        exact_change: true,
        allow_retry: true,
        hint_after_ms: profile.hintAfterMs,
      },
    };
  },
};
