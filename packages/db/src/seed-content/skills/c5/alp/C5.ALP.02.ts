import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_ALP_02_DATASET: SkillDataset = {
  skill_code: "C5.ALP.02",
  concept_label: "Nhận mặt chữ trong tên mình",
  surface: "game",
  items: [
    {
      id: "let_b",
      label: "chữ b",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🅱️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_c",
      label: "chữ c",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🅲",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_d",
      label: "chữ d",
      glyph: "d",
      image: {
        kind: "emoji",
        ref: "🅳",
      },
      contrast_group: "primary",
    },
    {
      id: "let_đ",
      label: "chữ đ",
      glyph: "đ",
      image: {
        kind: "emoji",
        ref: "🅳",
      },
      contrast_group: "contrast",
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhận mặt chữ trong tên mình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận mặt chữ trong tên mình",
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
      "Chúng mình cùng tìm hiểu về Nhận mặt chữ trong tên mình nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_b", "let_c", "let_d", "let_đ", "let_e"],
};

export const C5_ALP_02_SEED: SkillSeed = {
  dataset: C5_ALP_02_DATASET,
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
