import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_LIV_04_IDENTITY: SkillIdentity = {
  code: "C4.LIV.04",
  strand_code: "C4.LIV",
  competency_code: "C4",
  name: "Con vật ăn gì",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "infer"],
  tier: "basic",
  prerequisites: ["C4.LIV.02"],
  learning_objectives: [
    {
      code: "LO-C4.LIV.04-01",
      behaviour: "Nhận biết và thực hành Con vật ăn gì ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.LIV.04-02",
      behaviour: "Vận dụng Con vật ăn gì trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.LIV.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Con vật ăn gì",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_LIV_04_DATASET: SkillDataset = {
  skill_code: "C4.LIV.04",
  concept_label: "Con vật ăn gì",
  surface: "game",
  items: [
    {
      id: "diet_rabbit",
      label: "thỏ thích cà rốt",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "vật ăn cỏ",
      },
      contrast_group: "herbivore",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/diet_rabbit.mp3",
    },
    {
      id: "diet_cow",
      label: "bò thích gặm cỏ",
      image: {
        kind: "emoji",
        ref: "🐄",
      },
      category: {
        type: "vật ăn cỏ",
      },
      contrast_group: "herbivore",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/diet_cow.mp3",
    },
    {
      id: "diet_monkey",
      label: "khỉ thích chuối",
      image: {
        kind: "emoji",
        ref: "🐒",
      },
      category: {
        type: "vật ăn cỏ",
      },
      contrast_group: "herbivore",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/diet_monkey.mp3",
    },
    {
      id: "diet_panda",
      label: "gấu trúc ăn tre",
      image: {
        kind: "emoji",
        ref: "🐼",
      },
      category: {
        type: "vật ăn cỏ",
      },
      contrast_group: "herbivore",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/diet_panda.mp3",
    },
    {
      id: "diet_cat",
      label: "mèo thích ăn cá",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "vật ăn thịt",
      },
      contrast_group: "carnivore",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/diet_cat.mp3",
    },
    {
      id: "diet_frog",
      label: "ếch bắt côn trùng",
      image: {
        kind: "emoji",
        ref: "🐸",
      },
      category: {
        type: "vật ăn thịt",
      },
      contrast_group: "carnivore",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/diet_frog.mp3",
    },
    {
      id: "diet_lion",
      label: "sư tử săn mồi",
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "vật ăn thịt",
      },
      contrast_group: "carnivore",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/diet_lion.mp3",
    },
    {
      id: "diet_penguin",
      label: "chim cánh cụt",
      image: {
        kind: "emoji",
        ref: "🐧",
      },
      category: {
        type: "vật ăn thịt",
      },
      contrast_group: "carnivore",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/diet_penguin.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "diet_rabbit",
      target_id: "diet_cat",
    },
    {
      type: "contrast",
      source_id: "diet_cow",
      target_id: "diet_lion",
    },
    {
      type: "contrast",
      source_id: "diet_monkey",
      target_id: "diet_frog",
    },
    {
      type: "contrast",
      source_id: "diet_panda",
      target_id: "diet_penguin",
    },
  ],
  axes: {
    diet_type: {
      values: ["vật ăn cỏ", "vật ăn thịt"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Con vật ăn gì",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Con vật ăn gì",
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
    narration_template: "Chúng mình cùng tìm hiểu về Con vật ăn gì nhé",
  },
  ordering: [
    "diet_rabbit",
    "diet_cow",
    "diet_monkey",
    "diet_panda",
    "diet_cat",
    "diet_frog",
    "diet_lion",
    "diet_penguin",
  ],
};

export const C4_LIV_04_SEED: SkillSeed = {
  identity: C4_LIV_04_IDENTITY,
  dataset: C4_LIV_04_DATASET,
  levels: [
    {
      code: "GL-C4-LIV-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCMP-0007",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
  ],
};
