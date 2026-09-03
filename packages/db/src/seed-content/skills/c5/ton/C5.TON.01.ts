import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_TON_01_DATASET: SkillDataset = {
  skill_code: "C5.TON.01",
  concept_label: "Nghe ra hai tiếng khác thanh",
  surface: "game",
  items: [
    {
      id: "let_s",
      label: "chữ s",
      glyph: "s",
      image: {
        kind: "emoji",
        ref: "🆂",
      },
      contrast_group: "primary",
    },
    {
      id: "let_t",
      label: "chữ t",
      glyph: "t",
      image: {
        kind: "emoji",
        ref: "🆃",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_u",
      label: "chữ u",
      glyph: "u",
      image: {
        kind: "emoji",
        ref: "🆄",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ư",
      label: "chữ ư",
      glyph: "ư",
      image: {
        kind: "emoji",
        ref: "🆄",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_v",
      label: "chữ v",
      glyph: "v",
      image: {
        kind: "emoji",
        ref: "🆅",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe ra hai tiếng khác thanh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe ra hai tiếng khác thanh",
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
      "Chúng mình cùng tìm hiểu về Nghe ra hai tiếng khác thanh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_s", "let_t", "let_u", "let_ư", "let_v"],
};

export const C5_TON_01_SEED: SkillSeed = {
  dataset: C5_TON_01_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
