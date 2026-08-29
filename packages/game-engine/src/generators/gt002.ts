import { getNouns, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT002Generator: LevelGenerator = {
  engine: "GT-002",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["category", "attributes"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 8);
    const totalCount = age_band === "4-5" ? 4 : 6;
    const targetCount = 2;
    const sampled = sampleUnique(rng, nouns, totalCount);

    const items = sampled.map((item, idx) => ({
      item_id: `item_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
      is_correct: idx < targetCount,
    }));

    return {
      content_pack: {
        prompt: "Bé hãy chọn tất cả các hình theo yêu cầu nhé!",
        target_criterion: "Cùng nhóm chủ đề",
        items,
      },
      difficulty_params: {
        distractor_count: totalCount - targetCount,
        target_count: targetCount,
        hint_after_ms: 12_000,
        allow_retry: true,
      },
    };
  },
};
