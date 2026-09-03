import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C1_ADD_01_DATASET: SkillDataset = {
  skill_code: "C1.ADD.01",
  concept_label: "Cộng bằng đồ vật",
  surface: "game",
  items: [
    {
      id: "n0",
      label: "không",
      glyph: "0",
      value: 0,
      image: {
        kind: "emoji",
        ref: "0️⃣",
      },
    },
    {
      id: "n1",
      label: "một",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
    },
    {
      id: "n2",
      label: "hai",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
    },
    {
      id: "n3",
      label: "ba",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Cộng bằng đồ vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Cộng bằng đồ vật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Cộng bằng đồ vật nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3"],
};

export const C1_ADD_01_SEED: SkillSeed = {
  dataset: C1_ADD_01_DATASET,
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
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
