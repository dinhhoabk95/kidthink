import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_PRN_04_DATASET: SkillDataset = {
  skill_code: "C5.PRN.04",
  concept_label: "Khoảng cách giữa các từ",
  surface: "game",
  items: [
    {
      id: "let_a",
      label: "chữ a",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ă",
      label: "chữ ă",
      glyph: "ă",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "contrast",
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Khoảng cách giữa các từ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Khoảng cách giữa các từ",
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
      "Chúng mình cùng tìm hiểu về Khoảng cách giữa các từ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_a", "let_ă", "let_â", "let_b", "let_c"],
};

export const C5_PRN_04_SEED: SkillSeed = {
  dataset: C5_PRN_04_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
