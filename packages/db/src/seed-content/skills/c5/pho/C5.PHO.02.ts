import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_PHO_02_DATASET: SkillDataset = {
  skill_code: "C5.PHO.02",
  concept_label: "Đếm tiếng trong từ",
  surface: "game",
  items: [
    {
      id: "let_l",
      label: "chữ l",
      glyph: "l",
      image: {
        kind: "emoji",
        ref: "🅻",
      },
      contrast_group: "primary",
    },
    {
      id: "let_m",
      label: "chữ m",
      glyph: "m",
      image: {
        kind: "emoji",
        ref: "🅼",
      },
      contrast_group: "contrast",
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đếm tiếng trong từ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đếm tiếng trong từ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đếm tiếng trong từ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_l", "let_m", "let_n", "let_o", "let_ô"],
};

export const C5_PHO_02_SEED: SkillSeed = {
  dataset: C5_PHO_02_DATASET,
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
