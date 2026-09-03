import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C3_ALG_06_DATASET: SkillDataset = {
  skill_code: "C3.ALG.06",
  concept_label: "Tự viết chuỗi lệnh tới đích",
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
      description: "Làm quen cơ bản với Tự viết chuỗi lệnh tới đích",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự viết chuỗi lệnh tới đích",
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
      "Chúng mình cùng tìm hiểu về Tự viết chuỗi lệnh tới đích nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C3_ALG_06_SEED: SkillSeed = {
  dataset: C3_ALG_06_DATASET,
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
  ],
};
