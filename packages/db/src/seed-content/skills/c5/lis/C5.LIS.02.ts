import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_LIS_02_DATASET: SkillDataset = {
  skill_code: "C5.LIS.02",
  concept_label: "Nghe và làm theo",
  surface: "game",
  items: [
    {
      id: "bed",
      label: "cái giường",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "đồ dùng",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe và làm theo",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe và làm theo",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nghe và làm theo nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C5_LIS_02_SEED: SkillSeed = {
  dataset: C5_LIS_02_DATASET,
  levels: [
    {
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
