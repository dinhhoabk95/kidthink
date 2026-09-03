import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C2_GEO_07_DATASET: SkillDataset = {
  skill_code: "C2.GEO.07",
  concept_label: "Hình lục giác",
  surface: "game",
  items: [
    {
      id: "square",
      label: "hình vuông",
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "shape",
      },
    },
    {
      id: "triangle",
      label: "hình tam giác",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "shape",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Hình lục giác",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình lục giác",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hình lục giác nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["square", "triangle", "rectangle", "star"],
};

export const C2_GEO_07_SEED: SkillSeed = {
  dataset: C2_GEO_07_DATASET,
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
