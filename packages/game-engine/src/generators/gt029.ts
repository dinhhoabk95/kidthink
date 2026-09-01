import type { Rng } from "#src/rng/types";
import {
  getNouns,
  pickOne,
  sampleUnique,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { LevelGenerator } from "./types.js";

function generateOptions(
  correctValue: number,
  optionCount: number,
  rng: Rng,
  maxValue: number
): { option_id: string; value: number; is_correct: boolean }[] {
  const distractors = new Set<number>();
  const candidates: number[] = [];

  for (
    let v = Math.max(1, correctValue - 3);
    v <= Math.min(maxValue, correctValue + 3);
    v++
  ) {
    if (v !== correctValue) {
      candidates.push(v);
    }
  }

  let fallback = 1;
  while (candidates.length < optionCount - 1) {
    if (fallback !== correctValue && !candidates.includes(fallback)) {
      candidates.push(fallback);
    }
    fallback++;
  }

  const chosenDistractors = sampleUnique(rng, candidates, optionCount - 1);
  for (const d of chosenDistractors) {
    distractors.add(d);
  }

  const list = [
    {
      option_id: `opt_${correctValue}`,
      value: correctValue,
      is_correct: true,
    },
    ...Array.from(distractors).map((val) => ({
      option_id: `opt_${val}`,
      value: val,
      is_correct: false,
    })),
  ];

  return sampleUnique(rng, list, list.length);
}

export const GT029Generator: LevelGenerator = {
  engine: "GT-029",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["number", "quantity", "arithmetic"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const chosenNoun = pickOne(rng, nouns);

    let initialCount: number;
    let removeCount: number;
    let optionCount: number;

    if (age_band === "4-5") {
      initialCount = 4 + rng.nextInt(3); // 4, 5, 6
      removeCount = 1 + rng.nextInt(Math.min(2, initialCount - 2)); // 1 or 2
      optionCount = 3;
    } else {
      initialCount = 6 + rng.nextInt(5); // 6..10
      removeCount = 2 + rng.nextInt(Math.min(3, initialCount - 3)); // 2, 3, 4
      optionCount = 3 + rng.nextInt(2); // 3 or 4
    }

    const correctRemaining = initialCount - removeCount;

    const initial_items = Array.from({ length: initialCount }, (_, i) => ({
      item_id: `item_${i + 1}`,
      asset: {
        kind: "emoji" as const,
        ref: chosenNoun.emoji_ref,
      },
    }));

    const answer_options = generateOptions(
      correctRemaining,
      optionCount,
      rng,
      initialCount
    );

    const prompt = `Bé hãy bớt ${removeCount} ${chosenNoun.label_vi} rồi xem còn lại mấy ${chosenNoun.label_vi} nhé!`;

    return {
      content_pack: {
        prompt,
        initial_items,
        remove_count: removeCount,
        answer_options,
      },
      difficulty_params: {
        initial_count: initialCount,
        remove_count: removeCount,
        allow_retry: true,
        hint_after_ms: 8000,
        shuffle_items: true,
      },
    };
  },
};
