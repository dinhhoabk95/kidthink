import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_03_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.03",
  concept_label: "Nặng nhẹ",
  surface: "game",
  items: [
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nặng nhẹ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nặng nhẹ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nặng nhẹ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C1_MEAS_03_SEED: SkillSeed = {
  dataset: C1_MEAS_03_DATASET,
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
    {
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
