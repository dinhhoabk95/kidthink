import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_05_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.05",
  concept_label: "Dung tích",
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
      description: "Làm quen cơ bản với Dung tích",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dung tích",
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
    narration_template: "Chúng mình cùng tìm hiểu về Dung tích nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C1_MEAS_05_SEED: SkillSeed = {
  dataset: C1_MEAS_05_DATASET,
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
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
