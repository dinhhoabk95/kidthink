import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C4_TOO_01_DATASET: SkillDataset = {
  skill_code: "C4.TOO.01",
  concept_label: "Ngồi đúng, nghỉ mắt",
  surface: "game",
  items: [
    {
      id: "bowl",
      label: "cái bát",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "spoon",
      label: "cái thìa",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "cup",
      label: "cái cốc",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "bed",
      label: "cái giường",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "chair",
      label: "cái ghế",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ dùng",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ngồi đúng, nghỉ mắt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ngồi đúng, nghỉ mắt",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ngồi đúng, nghỉ mắt nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C4_TOO_01_SEED: SkillSeed = {
  dataset: C4_TOO_01_DATASET,
  levels: [
    {
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
