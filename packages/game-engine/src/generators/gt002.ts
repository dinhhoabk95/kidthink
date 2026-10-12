import { shuffle } from "#src/rng/shuffle";
import {
  getContrast,
  getNouns,
  sampleUnique,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT002Generator: LevelGenerator = {
  engine: "GT-002",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["category", "attributes"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const contrast = getContrast(vocabulary, 4);
    const totalCount = age_band === "4-5" ? 4 : 6;
    const targetCount = 2;
    // Vật đúng thuộc chủ đề, vật nhiễu thuộc chủ đề khác nhóm emoji: tiêu chí
    // "thuộc chủ đề" mới nhị phân được (`GT-002.md` §14).
    const targets = sampleUnique(rng, nouns, targetCount);
    const foils = sampleUnique(rng, contrast.nouns, totalCount - targetCount);
    const themeLabel = vocabulary.label_vi ?? vocabulary.theme;

    const items = shuffle(
      [
        ...targets.map((item) => ({ item, is_correct: true })),
        ...foils.map((item) => ({ item, is_correct: false })),
      ],
      rng
    ).map(({ item, is_correct }, idx) => ({
      item_id: `item_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
      is_correct,
    }));

    return {
      content_pack: {
        prompt: `Bé hãy chọn tất cả các hình thuộc chủ đề ${themeLabel} nhé!`,
        target_criterion: `Thuộc chủ đề ${themeLabel}`,
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
