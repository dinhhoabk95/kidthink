import { shuffle } from "#src/rng/shuffle";
import {
  getContrast,
  getNouns,
  sampleUnique,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { GeneratorInput, LevelGenerator } from "./types.js";

export const GT004Generator: LevelGenerator = {
  engine: "GT-004",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["classification", "sort-groups"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, vocabulary }: GeneratorInput) {
    const nouns = getNouns(vocabulary, 6);
    const contrast = getContrast(vocabulary, 2);
    // Hai nhóm cắt theo cùng một tiêu chí — chủ đề (`GT-004.md` §14).
    const group1Items = sampleUnique(rng, nouns, 2);
    const group2Items = sampleUnique(rng, contrast.nouns, 2);

    const groups = [
      {
        group_id: "g1",
        label: vocabulary.label_vi ?? vocabulary.theme,
        label_emoji: vocabulary.icon_emoji_ref ?? group1Items[0]?.emoji_ref,
      },
      {
        group_id: "g2",
        label: contrast.label_vi,
        label_emoji: contrast.icon_emoji_ref,
      },
    ];

    const items = shuffle(
      [
        ...group1Items.map((item) => ({ item, group: "g1" })),
        ...group2Items.map((item) => ({ item, group: "g2" })),
      ],
      rng
    ).map(({ item, group }, idx) => ({
      item_id: `item_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
      correct_group_id: group,
    }));

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
