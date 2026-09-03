import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_RHY_08_DATASET: SkillDataset = {
  skill_code: "C5.RHY.08",
  concept_label: "Tự nghĩ tiếng cùng vần",
  surface: "game",
  items: [
    {
      id: "let_e",
      label: "chữ e",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ê",
      label: "chữ ê",
      glyph: "ê",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_g",
      label: "chữ g",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "🅶",
      },
      contrast_group: "primary",
    },
    {
      id: "let_h",
      label: "chữ h",
      glyph: "h",
      image: {
        kind: "emoji",
        ref: "🅷",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_i",
      label: "chữ i",
      glyph: "i",
      image: {
        kind: "emoji",
        ref: "🅸",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tự nghĩ tiếng cùng vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự nghĩ tiếng cùng vần",
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
      "Chúng mình cùng tìm hiểu về Tự nghĩ tiếng cùng vần nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_e", "let_ê", "let_g", "let_h", "let_i"],
};

export const C5_RHY_08_SEED: SkillSeed = {
  dataset: C5_RHY_08_DATASET,
  levels: [
    {
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-036",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
  ],
};
