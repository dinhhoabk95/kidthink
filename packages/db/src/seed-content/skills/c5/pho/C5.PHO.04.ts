import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_PHO_04_DATASET: SkillDataset = {
  skill_code: "C5.PHO.04",
  concept_label: "Nghe ra âm đầu của tiếng",
  surface: "game",
  items: [
    {
      id: "let_n",
      label: "chữ n",
      glyph: "n",
      image: {
        kind: "emoji",
        ref: "🅽",
      },
      contrast_group: "primary",
    },
    {
      id: "let_o",
      label: "chữ o",
      glyph: "o",
      image: {
        kind: "emoji",
        ref: "🅾️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_ô",
      label: "chữ ô",
      glyph: "ô",
      image: {
        kind: "emoji",
        ref: "🅾️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ơ",
      label: "chữ ơ",
      glyph: "ơ",
      image: {
        kind: "emoji",
        ref: "🅾️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_p",
      label: "chữ p",
      glyph: "p",
      image: {
        kind: "emoji",
        ref: "🅿️",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe ra âm đầu của tiếng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe ra âm đầu của tiếng",
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
      "Chúng mình cùng tìm hiểu về Nghe ra âm đầu của tiếng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_n", "let_o", "let_ô", "let_ơ", "let_p"],
};

export const C5_PHO_04_SEED: SkillSeed = {
  dataset: C5_PHO_04_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
