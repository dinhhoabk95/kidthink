import {
  generateNumericOptions,
  getNouns,
  pickOne,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { LevelGenerator } from "./types.js";

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

    const answer_options = generateNumericOptions(
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
