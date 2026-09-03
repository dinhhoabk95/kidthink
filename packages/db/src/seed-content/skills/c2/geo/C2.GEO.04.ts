import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C2_GEO_04_DATASET: SkillDataset = {
  skill_code: "C2.GEO.04",
  concept_label: "Hình chữ nhật",
  surface: "game",
  items: [
    {
      id: "rectangle",
      label: "hình chữ nhật",
      image: {
        kind: "emoji",
        ref: "🟧",
      },
      category: {
        type: "shape",
      },
    },
    {
      id: "star",
      label: "hình ngôi sao",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "shape",
      },
    },
    {
      id: "heart",
      label: "hình trái tim",
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      category: {
        type: "shape",
      },
    },
    {
      id: "diamond",
      label: "hình thoi",
      image: {
        kind: "emoji",
        ref: "🔷",
      },
      category: {
        type: "shape",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Hình chữ nhật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình chữ nhật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hình chữ nhật nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["rectangle", "star", "heart", "diamond"],
};

export const C2_GEO_04_SEED: SkillSeed = {
  dataset: C2_GEO_04_DATASET,
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
