import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { GeneratorInput, LevelGenerator } from "./types.js";

export const GT004Generator: LevelGenerator = {
  engine: "GT-004",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["classification", "sort-groups"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, vocabulary }: GeneratorInput) {
    const nouns = getNouns(vocabulary, 10);
    const sampled = sampleUnique(rng, nouns, 6);

    const group1Emoji = sampled[0]?.emoji_ref || "🍎";
    const group2Emoji = sampled[1]?.emoji_ref || "🍌";

    const groups = [
      {
        group_id: "g1",
        label: "Nhóm 1",
        label_emoji: group1Emoji,
      },
      {
        group_id: "g2",
        label: "Nhóm 2",
        label_emoji: group2Emoji,
      },
    ];

    const items = [
      {
        item_id: "item_1",
        asset: { kind: "emoji" as const, ref: sampled[2]?.emoji_ref || "🥕" },
        correct_group_id: "g1",
      },
      {
        item_id: "item_2",
        asset: { kind: "emoji" as const, ref: sampled[3]?.emoji_ref || "🍓" },
        correct_group_id: "g1",
      },
      {
        item_id: "item_3",
        asset: { kind: "emoji" as const, ref: sampled[4]?.emoji_ref || "🍇" },
        correct_group_id: "g2",
      },
      {
        item_id: "item_4",
        asset: { kind: "emoji" as const, ref: sampled[5]?.emoji_ref || "🍉" },
        correct_group_id: "g2",
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy phân loại các đồ vật vào đúng nhóm nhé!",
        groups,
        items,
      },
      difficulty_params: {
        distractor_count: 0,
        hint_after_ms: 15_000,
        allow_retry: true,
        shuffle_items: true,
      },
    };
  },
};
