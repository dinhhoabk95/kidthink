import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C6_PER_03_DATASET: SkillDataset = {
  skill_code: "C6.PER.03",
  concept_label: "Làm xong rồi mới chơi tiếp",
  surface: "game",
  items: [
    {
      id: "chair",
      label: "cái ghế",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "apple",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "banana",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Làm xong rồi mới chơi tiếp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Làm xong rồi mới chơi tiếp",
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
    narration_template:
      "Chúng mình cùng tìm hiểu về Làm xong rồi mới chơi tiếp nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C6_PER_03_SEED: SkillSeed = {
  dataset: C6_PER_03_DATASET,
  levels: [
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-007",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
