import { getNouns, pickOne } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT012Generator: LevelGenerator = {
  engine: "GT-012",
  axes: {
    age_band: ["3-4", "4-5", "5-6"],
    what: ["memory", "subitizing", "number"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const item = pickOne(rng, nouns);

    const count = age_band === "3-4" ? 2 + rng.nextInt(2) : 3 + rng.nextInt(3); // 2..3 or 3..5

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
        options,
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
