import { getNouns, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT003Generator: LevelGenerator = {
  engine: "GT-003",
  axes: {
    age_band: ["3-4", "4-5", "5-6"],
    what: ["classification", "drag-to-container"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const totalCount = age_band === "3-4" ? 3 : 4;
    const targetCount = age_band === "3-4" ? 2 : 2;
    const sampled = sampleUnique(rng, nouns, totalCount);

    const items = sampled.map((item, idx) => {
      const isTarget = idx < targetCount;
      return {
        item_id: `item_${idx + 1}`,
        attribute: isTarget ? "target_attr" : "other_attr",
        asset: { kind: "emoji" as const, ref: item.emoji_ref },
        is_correct: isTarget,
      };
    });

    return {
      content_pack: {
        prompt: "Bé hãy kéo các đồ vật thích hợp vào giỏ nhé!",
        container: {
          container_id: "basket_1",
          label: "Giỏ đồ",
          accepts_attribute: "target_attr",
        },
        items,
      },
      difficulty_params: {
        distractor_count: totalCount - targetCount,
        target_count: targetCount,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
