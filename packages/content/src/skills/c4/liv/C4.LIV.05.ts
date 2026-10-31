import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_LIV_05_IDENTITY: SkillIdentity = {
  code: "C4.LIV.05",
  strand_code: "C4.LIV",
  competency_code: "C4",
  name: "Nơi sống của con vật",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sort", "infer"],
  tier: "core",
  prerequisites: ["C4.LIV.02", "C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C4.LIV.05-01",
      behaviour: "Nhận biết và thực hành Nơi sống của con vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.LIV.05-02",
      behaviour: "Vận dụng Nơi sống của con vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.LIV.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nơi sống của con vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_LIV_05_DATASET: SkillDataset = {
  skill_code: "C4.LIV.05",
  concept_label: "Nơi sống của con vật",
  surface: "game",
  items: [
    {
      id: "hab_fish",
      label: "chú cá vàng",
      image: {
        kind: "emoji",
        ref: "🐠",
      },
      category: {
        type: "sống dưới nước",
      },
      contrast_group: "water",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/hab_fish.mp3",
    },
    {
      id: "hab_dolphin",
      label: "chú cá heo",
      image: {
        kind: "emoji",
        ref: "🐬",
      },
      category: {
        type: "sống dưới nước",
      },
      contrast_group: "water",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/hab_dolphin.mp3",
    },
    {
      id: "hab_crab",
      label: "chú cua biển",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      category: {
        type: "sống dưới nước",
      },
      contrast_group: "water",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/hab_crab.mp3",
    },
    {
      id: "hab_octopus",
      label: "chú bạch tuộc",
      image: {
        kind: "emoji",
        ref: "🐙",
      },
      category: {
        type: "sống dưới nước",
      },
      contrast_group: "water",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/hab_octopus.mp3",
    },
    {
      id: "hab_dog",
      label: "chú cún con",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "sống trên cạn",
      },
      contrast_group: "land",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/hab_dog.mp3",
    },
    {
      id: "hab_cat",
      label: "chú mèo mướp",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "sống trên cạn",
      },
      contrast_group: "land",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/hab_cat.mp3",
    },
    {
      id: "hab_bird",
      label: "chú chim sẻ",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "sống trên cạn",
      },
      contrast_group: "land",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/hab_bird.mp3",
    },
    {
      id: "hab_elephant",
      label: "chú voi con",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "sống trên cạn",
      },
      contrast_group: "land",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/hab_elephant.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "hab_fish",
      target_id: "hab_dog",
    },
    {
      type: "contrast",
      source_id: "hab_dolphin",
      target_id: "hab_elephant",
    },
    {
      type: "contrast",
      source_id: "hab_crab",
      target_id: "hab_cat",
    },
    {
      type: "contrast",
      source_id: "hab_octopus",
      target_id: "hab_bird",
    },
  ],
  axes: {
    habitat: {
      values: ["sống dưới nước", "sống trên cạn"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nơi sống của con vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nơi sống của con vật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nơi sống của con vật nhé",
  },
  ordering: [
    "hab_fish",
    "hab_dolphin",
    "hab_crab",
    "hab_octopus",
    "hab_dog",
    "hab_cat",
    "hab_bird",
    "hab_elephant",
  ],
};

export const C4_LIV_05_SEED: SkillSeed = {
  identity: C4_LIV_05_IDENTITY,
  dataset: C4_LIV_05_DATASET,
  levels: [
    {
      code: "GL-C4-LIV-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCMP-0009",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
  ],
};
