import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_ALP_01_DATASET: SkillDataset = {
  skill_code: "C5.ALP.01",
  concept_label: "Chữ khác hình, khác số",
  surface: "game",
  items: [
    {
      id: "let_â",
      label: "chữ â",
      glyph: "â",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_b",
      label: "chữ b",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🅱️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_c",
      label: "chữ c",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🅲",
      },
      contrast_group: "primary",
    },
    {
      id: "let_d",
      label: "chữ d",
      glyph: "d",
      image: {
        kind: "emoji",
        ref: "🅳",
      },
      contrast_group: "contrast",
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ khác hình, khác số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ khác hình, khác số",
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
      "Chúng mình cùng tìm hiểu về Chữ khác hình, khác số nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_â", "let_b", "let_c", "let_d", "let_đ"],
};

export const C5_ALP_01_SEED: SkillSeed = {
  dataset: C5_ALP_01_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
