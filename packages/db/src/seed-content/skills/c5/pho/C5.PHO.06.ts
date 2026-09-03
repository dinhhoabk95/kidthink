import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_PHO_06_DATASET: SkillDataset = {
  skill_code: "C5.PHO.06",
  concept_label: "Tách tiếng thành âm đầu và vần",
  surface: "game",
  items: [
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
    {
      id: "let_q",
      label: "chữ q",
      glyph: "q",
      image: {
        kind: "emoji",
        ref: "🆀",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_r",
      label: "chữ r",
      glyph: "r",
      image: {
        kind: "emoji",
        ref: "🆁",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tách tiếng thành âm đầu và vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tách tiếng thành âm đầu và vần",
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
      "Chúng mình cùng tìm hiểu về Tách tiếng thành âm đầu và vần nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_ô", "let_ơ", "let_p", "let_q", "let_r"],
};

export const C5_PHO_06_SEED: SkillSeed = {
  dataset: C5_PHO_06_DATASET,
  levels: [
    {
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
  ],
};
