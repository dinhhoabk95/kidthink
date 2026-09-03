import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_RHY_03_DATASET: SkillDataset = {
  skill_code: "C5.RHY.03",
  concept_label: "Đọc đồng dao có vần",
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
      description: "Làm quen cơ bản với Đọc đồng dao có vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc đồng dao có vần",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đọc đồng dao có vần nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_â", "let_b", "let_c", "let_d", "let_đ"],
};

export const C5_RHY_03_SEED: SkillSeed = {
  dataset: C5_RHY_03_DATASET,
  levels: [
    {
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
