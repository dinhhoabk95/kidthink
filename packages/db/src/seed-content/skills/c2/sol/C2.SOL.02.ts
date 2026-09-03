import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C2_SOL_02_DATASET: SkillDataset = {
  skill_code: "C2.SOL.02",
  concept_label: "Lăn được – đứng yên",
  surface: "game",
  items: [
    {
      id: "circle",
      label: "hình tròn",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "shape",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Lăn được – đứng yên",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Lăn được – đứng yên",
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
    narration_template: "Chúng mình cùng tìm hiểu về Lăn được – đứng yên nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["circle", "square", "triangle", "rectangle"],
};

export const C2_SOL_02_SEED: SkillSeed = {
  dataset: C2_SOL_02_DATASET,
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
