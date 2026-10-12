import { AGE_BANDS } from "#src/contracts/types";
import { shuffle } from "#src/rng/shuffle";
import {
  getContrast,
  getNouns,
  sampleUnique,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const TARGET_ATTRIBUTE = "target_attr";
const OTHER_ATTRIBUTE = "other_attr";

export const GT003Generator: LevelGenerator = {
  engine: "GT-003",
  axes: {
    age_band: [...AGE_BANDS],
    what: ["classification", "drag-to-container"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const contrast = getContrast(vocabulary, 2);
    const totalCount = age_band === "3-4" ? 3 : 4;
    const targetCount = 2;
    const targets = sampleUnique(rng, nouns, targetCount);
    const foils = sampleUnique(rng, contrast.nouns, totalCount - targetCount);
    const themeLabel = vocabulary.label_vi ?? vocabulary.theme;

    const items = [
      ...targets.map((item) => ({ item, isTarget: true })),
      ...foils.map((item) => ({ item, isTarget: false })),
    ].map(({ item, isTarget }, idx) => ({
      item_id: `item_${idx + 1}`,
      attribute: isTarget ? TARGET_ATTRIBUTE : OTHER_ATTRIBUTE,
      label: item.label_vi,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
      is_correct: isTarget,
    }));

    return {
      content_pack: {
        prompt: `Bé hãy kéo các hình thuộc chủ đề ${themeLabel} vào giỏ nhé!`,
        container: {
          container_id: "basket_1",
          label: themeLabel,
          accepts_attribute: TARGET_ATTRIBUTE,
        },
        // Xáo trước khi ghi vào corpus: `is_correct` gắn theo chỉ số lúc sinh,
        // nên không xáo thì MỌI level sinh ra đều có đáp án ở hai ô đầu.
        items: shuffle(items, rng),
      },
      difficulty_params: {
        item_count: items.length,
        distractor_count: totalCount - targetCount,
        target_count: targetCount,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
