import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_RHY_07_DATASET: SkillDataset = {
  skill_code: "C5.RHY.07",
  concept_label: "Vần có nguyên âm đôi: ia · ua · ưa",
  surface: "game",
  items: [
    {
      id: "let_đ",
      label: "chữ đ",
      glyph: "đ",
      image: {
        kind: "emoji",
        ref: "🅳",
      },
      contrast_group: "primary",
    },
    {
      id: "let_e",
      label: "chữ e",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_ê",
      label: "chữ ê",
      glyph: "ê",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "primary",
    },
    {
      id: "let_g",
      label: "chữ g",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "🅶",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_h",
      label: "chữ h",
      glyph: "h",
      image: {
        kind: "emoji",
        ref: "🅷",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vần có nguyên âm đôi: ia · ua · ưa",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vần có nguyên âm đôi: ia · ua · ưa",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi và số lượng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục và độc lập thực hiện",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về Vần có nguyên âm đôi: ia · ua · ưa nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_đ", "let_e", "let_ê", "let_g", "let_h"],
};

export const C5_RHY_07_SEED: SkillSeed = {
  dataset: C5_RHY_07_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
  ],
};
