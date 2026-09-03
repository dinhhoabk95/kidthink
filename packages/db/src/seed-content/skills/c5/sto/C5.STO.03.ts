import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C5_STO_03_DATASET: SkillDataset = {
  skill_code: "C5.STO.03",
  concept_label: "Chọn kết thúc hợp lý",
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
      description: "Làm quen cơ bản với Chọn kết thúc hợp lý",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn kết thúc hợp lý",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chọn kết thúc hợp lý nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C5_STO_03_SEED: SkillSeed = {
  dataset: C5_STO_03_DATASET,
  levels: [
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
