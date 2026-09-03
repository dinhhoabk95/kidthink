import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C2_GEO_05_DATASET: SkillDataset = {
  skill_code: "C2.GEO.05",
  concept_label: "Hình oval",
  surface: "game",
  items: [
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
    {
      id: "oval",
      label: "hình bầu dục",
      image: {
        kind: "emoji",
        ref: "🟢",
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
      description: "Làm quen cơ bản với Hình oval",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình oval",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hình oval nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["star", "heart", "diamond", "oval"],
};

export const C2_GEO_05_SEED: SkillSeed = {
  dataset: C2_GEO_05_DATASET,
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
