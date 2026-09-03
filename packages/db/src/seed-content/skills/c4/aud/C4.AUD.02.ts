import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C4_AUD_02_DATASET: SkillDataset = {
  skill_code: "C4.AUD.02",
  concept_label: "Tiếng con vật",
  surface: "game",
  items: [
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
    {
      id: "fish",
      label: "con cá",
      image: {
        kind: "emoji",
        ref: "🐟",
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
      description: "Làm quen cơ bản với Tiếng con vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tiếng con vật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tiếng con vật nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C4_AUD_02_SEED: SkillSeed = {
  dataset: C4_AUD_02_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
