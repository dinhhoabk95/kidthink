import { AGE_BANDS } from "#src/contracts/types";
import { shuffle } from "#src/rng/shuffle";
import { FLASH_ITEM_CAP_BY_BAND } from "#src/templates/GT-012/template";
import { getNouns, pickOne, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT012Generator: LevelGenerator = {
  engine: "GT-012",
  axes: {
    age_band: [...AGE_BANDS],
    what: ["memory", "subitizing", "number"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const item = pickOne(rng, nouns);

    // Trần trí nhớ thị giác theo band (BR-E012-03): 2 · 3 · 4 vật.
    const cap = FLASH_ITEM_CAP_BY_BAND[age_band];
    const count = 2 + rng.nextInt(cap - 1); // 2..cap

    const flash_items = Array.from({ length: count }, (_, i) => ({
      item_id: `flash_${i + 1}`,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
    }));

    const distractor1 = count > 1 ? count - 1 : count + 2;
    const distractor2 = count + 1;

    const options = [
      { value: count, is_correct: true },
      { value: distractor1, is_correct: false },
      { value: distractor2, is_correct: false },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy nhìn nhanh và nhớ xem có bao nhiêu hình nhé!",
        flash_items,
        arrangement: "dice" as const,
        options: shuffle(options, rng),
      },
      difficulty_params: {
        flash_ms: 1500,
        item_count: count,
        distractor_count: 2,
        allow_replay: true,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
