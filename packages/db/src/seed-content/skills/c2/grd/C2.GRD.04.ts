import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C2_GRD_04_DATASET: SkillDataset = {
  skill_code: "C2.GRD.04",
  concept_label: "Sơ đồ lưới của lớp học",
  surface: "game",
  items: [
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
    {
      id: "banana",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
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
      description: "Làm quen cơ bản với Sơ đồ lưới của lớp học",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Sơ đồ lưới của lớp học",
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
      "Chúng mình cùng tìm hiểu về Sơ đồ lưới của lớp học nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C2_GRD_04_SEED: SkillSeed = {
  dataset: C2_GRD_04_DATASET,
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
