import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SEN_03_IDENTITY: SkillIdentity = {
  code: "C4.SEN.03",
  strand_code: "C4.SEN",
  competency_code: "C4",
  name: "Phân biệt kết cấu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.SEN.03-01",
      behaviour: "Nhận biết và thực hành Phân biệt kết cấu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SEN.03-02",
      behaviour: "Vận dụng Phân biệt kết cấu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SEN.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Phân biệt kết cấu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SEN_03_DATASET: SkillDataset = {
  skill_code: "C4.SEN.03",
  concept_label: "Phân biệt kết cấu",
  surface: "game",
  items: [
    {
      id: "mirror",
      label: "mặt gương nhẵn",
      image: {
        kind: "emoji",
        ref: "🪞",
      },
      category: {
        type: "vật nhẵn mịn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "smooth",
      audio_path: "/audio/vi/c4/mirror.mp3",
    },
    {
      id: "ceramic_cup",
      label: "cốc sứ láng",
      image: {
        kind: "emoji",
        ref: "🍵",
      },
      category: {
        type: "vật nhẵn mịn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "smooth",
      audio_path: "/audio/vi/c4/ceramic_cup.mp3",
    },
    {
      id: "bowl",
      label: "bát sứ nhẵn",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "vật nhẵn mịn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "smooth",
      audio_path: "/audio/vi/c4/bowl.mp3",
    },
    {
      id: "apple",
      label: "quả táo bóng",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "vật nhẵn mịn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "smooth",
      audio_path: "/audio/vi/c4/apple.mp3",
    },
    {
      id: "pineapple",
      label: "vỏ dứa gai",
      image: {
        kind: "emoji",
        ref: "🍍",
      },
      category: {
        type: "vật sần sùi",
      },
      value: 1,
      ordering: 5,
      contrast_group: "rough",
      audio_path: "/audio/vi/c4/pineapple.mp3",
    },
    {
      id: "potato",
      label: "củ khoai sần",
      image: {
        kind: "emoji",
        ref: "🥔",
      },
      category: {
        type: "vật sần sùi",
      },
      value: 2,
      ordering: 6,
      contrast_group: "rough",
      audio_path: "/audio/vi/c4/potato.mp3",
    },
    {
      id: "shell",
      label: "vỏ sò khía",
      image: {
        kind: "emoji",
        ref: "🐚",
      },
      category: {
        type: "vật sần sùi",
      },
      value: 3,
      ordering: 7,
      contrast_group: "rough",
      audio_path: "/audio/vi/c4/shell.mp3",
    },
    {
      id: "cactus",
      label: "xương rồng gai",
      image: {
        kind: "emoji",
        ref: "🌵",
      },
      category: {
        type: "vật sần sùi",
      },
      value: 4,
      ordering: 8,
      contrast_group: "rough",
      audio_path: "/audio/vi/c4/cactus.mp3",
    },
  ],
  axes: {
    category: {
      values: ["vật nhẵn mịn", "vật sần sùi"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "mirror",
      target_id: "pineapple",
    },
    {
      type: "contrast",
      source_id: "ceramic_cup",
      target_id: "potato",
    },
    {
      type: "contrast",
      source_id: "bowl",
      target_id: "shell",
    },
    {
      type: "contrast",
      source_id: "apple",
      target_id: "cactus",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Phân biệt kết cấu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân biệt kết cấu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Phân biệt kết cấu nhé",
  },
  ordering: [
    "mirror",
    "ceramic_cup",
    "bowl",
    "apple",
    "pineapple",
    "potato",
    "shell",
    "cactus",
  ],
};

export const C4_SEN_03_SEED: SkillSeed = {
  identity: C4_SEN_03_IDENTITY,
  dataset: C4_SEN_03_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C4-SEN-SND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-SND-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
  ],
};
