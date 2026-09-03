import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C2_PER_04_DATASET: SkillDataset = {
  skill_code: "C2.PER.04",
  concept_label: "Nhìn từ bên cạnh",
  surface: "game",
  items: [
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
    {
      id: "apple",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhìn từ bên cạnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhìn từ bên cạnh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhìn từ bên cạnh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C2_PER_04_SEED: SkillSeed = {
  dataset: C2_PER_04_DATASET,
  levels: [
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
