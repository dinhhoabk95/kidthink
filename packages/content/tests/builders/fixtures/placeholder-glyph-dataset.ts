import type { SkillDataset } from "@mindkid/shared";

/**
 * Ca âm cho luật glyph (`BR-SDS-03`, skill-dataset-model §7): "A1", "B2" là nhãn
 * chu kỳ của người soạn, không phải ký hiệu viết được mà trẻ đang học.
 */
export const PLACEHOLDER_GLYPH_DATASET: SkillDataset = {
  skill_code: "C1.TEST.PLACEHOLDER",
  concept_label: "Quy luật AB",
  surface: "game",
  ladder: [{ rung: 1, dimension: "test", description: "test" }],
  phrasing: { prompt_template: "Bé nối tiếp quy luật nhé!" },
  items: [
    {
      id: "pat_a1",
      label: "ô tô đỏ",
      glyph: "A1",
      image: { kind: "emoji", ref: "🚗" },
    },
    {
      id: "pat_b1",
      label: "xe buýt",
      glyph: "B1",
      image: { kind: "emoji", ref: "🚌" },
    },
  ],
};
