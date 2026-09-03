import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C1_PROB_01_DATASET: SkillDataset = {
  skill_code: "C1.PROB.01",
  concept_label: "Chọn cách giải",
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
      description: "Làm quen cơ bản với Chọn cách giải",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn cách giải",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chọn cách giải nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C1_PROB_01_SEED: SkillSeed = {
  dataset: C1_PROB_01_DATASET,
  levels: [
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-007",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-009",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-013",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
  ],
};
