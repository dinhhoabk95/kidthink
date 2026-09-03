import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const C6_ATT_03_DATASET: SkillDataset = {
  skill_code: "C6.ATT.03",
  concept_label: "Bỏ qua vật gây nhiễu",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Bỏ qua vật gây nhiễu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Bỏ qua vật gây nhiễu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Bỏ qua vật gây nhiễu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C6_ATT_03_SEED: SkillSeed = {
  dataset: C6_ATT_03_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
