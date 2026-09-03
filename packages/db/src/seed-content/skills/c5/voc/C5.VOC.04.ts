import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_VOC_04_DATASET: SkillDataset = {
  skill_code: "C5.VOC.04",
  concept_label: "Từ vựng gia đình",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Từ vựng gia đình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng gia đình",
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
    narration_template: "Chúng mình cùng tìm hiểu về Từ vựng gia đình nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C5_VOC_04_SEED: SkillSeed = {
  dataset: C5_VOC_04_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
