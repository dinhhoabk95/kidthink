import type { SkillDataset } from "@mindkid/shared";

/**
 * Ca âm GT-020 (`BR-E020-10`): vật mang glyph "1" và ảnh 🍎, vật khác mang glyph
 * "🍎🍎" và ảnh 🍎 — bản cũ ghép glyph↔ảnh nên hai thẻ 🍎 của hai cặp khác nhau
 * trông giống hệt mà lật trúng vẫn bị tính lệch cặp.
 */
export const GLYPH_VS_IMAGE_DATASET: SkillDataset = {
  skill_code: "C1.TEST.FLIP",
  concept_label: "Số và lượng",
  surface: "game",
  ladder: [{ rung: 1, dimension: "test", description: "test" }],
  phrasing: { prompt_template: "Bé lật thẻ nhé!" },
  items: [
    { id: "n1", label: "một", glyph: "1", image: { kind: "emoji", ref: "🍎" } },
    { id: "n2", label: "hai", glyph: "2", image: { kind: "emoji", ref: "🍎" } },
    { id: "a1", label: "một quả táo", image: { kind: "emoji", ref: "🍎" } },
    {
      id: "t1",
      label: "quả táo chữ",
      glyph: "🍎",
      image: { kind: "emoji", ref: "🐟" },
    },
  ],
};
