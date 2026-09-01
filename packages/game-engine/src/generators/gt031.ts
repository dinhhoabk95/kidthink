import { canFormTargetAmount } from "#src/templates/GT-031/template";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const DENOMINATIONS = [1, 2, 5, 10];

export const GT031Generator: LevelGenerator = {
  engine: "GT-031",
  axes: {
    age_band: ["5-6"],
    what: ["money", "number", "quantity"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band: _age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 2);
    const itemNoun = nouns[0] ?? {
      emoji_ref: "EMJ-red-apple",
      label_vi: "Quả táo",
    };

    // Pick 2-4 solution coins
    const solutionCoinCount = 2 + rng.nextInt(3); // 2, 3, or 4 coins
    const solutionValues: number[] = [];
    let targetAmount = 0;

    for (let i = 0; i < solutionCoinCount; i++) {
      const denomIndex = rng.nextInt(DENOMINATIONS.length);
      const val = DENOMINATIONS[denomIndex] ?? 1;
      solutionValues.push(val);
      targetAmount += val;
    }

    // Add 1-2 distractor coins
    const distractorCount = 1 + rng.nextInt(2); // 1 or 2 distractor coins
    const allCoinValues = [...solutionValues];

    for (let i = 0; i < distractorCount; i++) {
      const denomIndex = rng.nextInt(DENOMINATIONS.length);
      const val = DENOMINATIONS[denomIndex] ?? 2;
      allCoinValues.push(val);
    }

    // Shuffle coins deterministically with sampleUnique
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
      asset: {
        kind: "emoji" as const,
        ref: "EMJ-coin",
      },
      value: val,
    }));

    return {
      content_pack: {
        prompt: `Bé hãy chọn các đồng xu để trả đúng ${targetAmount} đồng nhé!`,
        target_amount: targetAmount,
        item_to_buy: {
          label: itemNoun.label_vi,
          asset: {
            kind: "emoji" as const,
            ref: itemNoun.emoji_ref,
          },
        },
        coins,
      },
      difficulty_params: {
        coin_kind_count: new Set(shuffledCoinValues).size,
        target_amount: targetAmount,
        exact_change: true,
        allow_retry: true,
        hint_after_ms: 8000,
      },
    };
  },
};
