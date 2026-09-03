import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C4_MAT_05_DATASET: SkillDataset = {
  skill_code: "C4.MAT.05",
  concept_label: "Nước: lỏng · đá · hơi",
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
      description: "Làm quen cơ bản với Nước: lỏng · đá · hơi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nước: lỏng · đá · hơi",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nước: lỏng · đá · hơi nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C4_MAT_05_SEED: SkillSeed = {
  dataset: C4_MAT_05_DATASET,
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
