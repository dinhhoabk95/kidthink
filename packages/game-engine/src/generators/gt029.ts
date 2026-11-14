import { shuffle } from "#src/rng/shuffle";
import type { Rng } from "#src/rng/types";
import {
  generateNumericOptions,
  getNouns,
  pickOne,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { LevelGenerator } from "./types.js";

function buildSpacedOptions45(
  correctValue: number,
  rng: Rng
): {
  readonly is_correct: boolean;
  readonly option_id: string;
  readonly value: number;
}[] {
  const candidates: [number, number, number][] = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a + 2; b <= 6; b++) {
      for (let c = b + 2; c <= 6; c++) {
        if (a === correctValue || b === correctValue || c === correctValue) {
          candidates.push([a, b, c]);
        }
      }
    }
  }
  const chosen =
    candidates.length > 0
      ? pickOne(rng, candidates)
      : [
          Math.max(0, correctValue - 2),
          correctValue,
          Math.min(6, correctValue + 2),
        ];
  const values = shuffle([...chosen], rng);
  return values.map((v) => ({
    option_id: `opt_${v}`,
    value: v,
    is_correct: v === correctValue,
  }));
}

export const GT029Generator: LevelGenerator = {
  engine: "GT-029",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["number", "quantity", "arithmetic"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary, escalation_step }) {
    const nouns = getNouns(vocabulary, 6);
    const chosenNoun = pickOne(rng, nouns);
    const step = escalation_step ?? 0;

    let initialCount: number;
    let removeCount: number;
    let optionCount: number;

    if (age_band === "4-5") {
      initialCount = 4 + (step > 0 ? Math.min(2, step) : rng.nextInt(3)); // 4..6
      removeCount = 1 + rng.nextInt(Math.min(2, initialCount - 2)); // 1..2
      optionCount = 3;
    } else {
      initialCount = 6 + (step > 0 ? Math.min(2, step) : rng.nextInt(3)); // 6..8 (N1)
      removeCount = 2 + rng.nextInt(Math.min(3, initialCount - 3)); // 2..4
      optionCount = 3 + rng.nextInt(2); // 3..4
    }

    const correctRemaining = initialCount - removeCount;

    const initial_items = Array.from({ length: initialCount }, (_, i) => ({
      item_id: `item_${i + 1}`,
      asset: {
        kind: "emoji" as const,
        ref: chosenNoun.emoji_ref,
      },
    }));

    const answer_options =
      age_band === "4-5"
        ? buildSpacedOptions45(correctRemaining, rng)
        : generateNumericOptions(
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
