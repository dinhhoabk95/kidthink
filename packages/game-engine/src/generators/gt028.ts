import { getNouns, pickOne, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT028Generator: LevelGenerator = {
  engine: "GT-028",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["number", "quantity", "pattern"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const chosenNoun = pickOne(rng, nouns);

    const stepOptions =
      age_band === "4-5" ? ([2, 5] as const) : ([2, 5, 10] as const);
    const step = pickOne(rng, stepOptions as unknown as (2 | 5 | 10)[]);

    const targetSteps =
      age_band === "4-5" ? 2 + rng.nextInt(3) : 3 + rng.nextInt(4); // 2-4 for 4-5; 3-6 for 5-6
    const targetTotal = step * targetSteps;

    const itemCount = Math.min(20, Math.max(targetSteps + 2, 6));
    const items = Array.from({ length: itemCount }, (_, idx) => ({
      item_id: `item_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: chosenNoun.emoji_ref },
    }));

    return {
      content_pack: {
        prompt: `Bé hãy chạm để đếm nhảy cóc ${step} cho đủ ${targetTotal} nhé!`,
        step,
        target_total: targetTotal,
        items,
      },
      difficulty_params: {
        step,
        item_count: itemCount,
        allow_undo: true,
        hint_after_ms: 8000,
        shuffle_items: true,
      },
    };
  },
};
