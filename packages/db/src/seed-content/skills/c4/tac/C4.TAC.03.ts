import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C4_TAC_03_DATASET: SkillDataset = {
  skill_code: "C4.TAC.03",
  concept_label: "Nóng – lạnh",
  surface: "game",
  items: [
    {
      id: "corn",
      label: "bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "rau củ",
      },
    },
    {
      id: "dog",
      label: "con chó",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "cat",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "chicken",
      label: "con gà",
      image: {
        kind: "emoji",
        ref: "🐓",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "duck",
      label: "con vịt",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "động vật",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nóng – lạnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nóng – lạnh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nóng – lạnh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C4_TAC_03_SEED: SkillSeed = {
  dataset: C4_TAC_03_DATASET,
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
