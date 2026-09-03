import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C4_EXP_06_DATASET: SkillDataset = {
  skill_code: "C4.EXP.06",
  concept_label: "Đổi một điều kiện rồi thử lại",
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
      description: "Làm quen cơ bản với Đổi một điều kiện rồi thử lại",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đổi một điều kiện rồi thử lại",
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
      "Chúng mình cùng tìm hiểu về Đổi một điều kiện rồi thử lại nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C4_EXP_06_SEED: SkillSeed = {
  dataset: C4_EXP_06_DATASET,
  levels: [
    {
      template: "GT-010",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-026",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
  ],
};
