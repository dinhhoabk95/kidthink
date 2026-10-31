import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_OBS_01_IDENTITY: SkillIdentity = {
  code: "C4.OBS.01",
  strand_code: "C4.OBS",
  competency_code: "C4",
  name: "Quan sát có mục đích",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe", "plan"],
  tier: "basic",
  prerequisites: ["C4.DET.01"],
  learning_objectives: [
    {
      code: "LO-C4.OBS.01-01",
      behaviour: "Nhận biết và thực hành Quan sát có mục đích ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.OBS.01-02",
      behaviour: "Vận dụng Quan sát có mục đích trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.OBS.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Quan sát có mục đích",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_OBS_01_DATASET: SkillDataset = {
  skill_code: "C4.OBS.01",
  concept_label: "Quan sát có mục đích",
  surface: "game",
  items: [
    {
      id: "sun",
      label: "ông mặt trời",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "vật trên trời",
      },
      value: 1,
      ordering: 1,
      contrast_group: "sky",
      audio_path: "/audio/vi/c4/sun.mp3",
    },
    {
      id: "rainbow",
      label: "cầu vồng đẹp",
      image: {
        kind: "emoji",
        ref: "🌈",
      },
      category: {
        type: "vật trên trời",
      },
      value: 2,
      ordering: 2,
      contrast_group: "sky",
      audio_path: "/audio/vi/c4/rainbow.mp3",
    },
    {
      id: "cloud",
      label: "đám mây trắng",
      image: {
        kind: "emoji",
        ref: "☁️",
      },
      category: {
        type: "vật trên trời",
      },
      value: 3,
      ordering: 3,
      contrast_group: "sky",
      audio_path: "/audio/vi/c4/cloud.mp3",
    },
    {
      id: "star",
      label: "ngôi sao sáng",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "vật trên trời",
      },
      value: 4,
      ordering: 4,
      contrast_group: "sky",
      audio_path: "/audio/vi/c4/star.mp3",
    },
    {
      id: "tree",
      label: "cây xanh mát",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "cây trong vườn",
      },
      value: 1,
      ordering: 5,
      contrast_group: "plant",
      audio_path: "/audio/vi/c4/tree.mp3",
    },
    {
      id: "sunflower",
      label: "hoa hướng dương",
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      category: {
        type: "cây trong vườn",
      },
      value: 2,
      ordering: 6,
      contrast_group: "plant",
      audio_path: "/audio/vi/c4/sunflower.mp3",
    },
    {
      id: "tulip",
      label: "bông hoa tu-líp",
      image: {
        kind: "emoji",
        ref: "🌷",
      },
      category: {
        type: "cây trong vườn",
      },
      value: 3,
      ordering: 7,
      contrast_group: "plant",
      audio_path: "/audio/vi/c4/tulip.mp3",
    },
    {
      id: "leaf",
      label: "chiếc lá phong",
      image: {
        kind: "emoji",
        ref: "🍁",
      },
      category: {
        type: "cây trong vườn",
      },
      value: 4,
      ordering: 8,
      contrast_group: "plant",
      audio_path: "/audio/vi/c4/leaf.mp3",
    },
  ],
  axes: {
    category: {
      values: ["vật trên trời", "cây trong vườn"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "sun",
      target_id: "tree",
    },
    {
      type: "contrast",
      source_id: "rainbow",
      target_id: "sunflower",
    },
    {
      type: "contrast",
      source_id: "cloud",
      target_id: "tulip",
    },
    {
      type: "contrast",
      source_id: "star",
      target_id: "leaf",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Quan sát có mục đích",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Quan sát có mục đích",
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
    narration_template: "Chúng mình cùng tìm hiểu về Quan sát có mục đích nhé",
  },
  ordering: [
    "sun",
    "rainbow",
    "cloud",
    "star",
    "tree",
    "sunflower",
    "tulip",
    "leaf",
  ],
};

export const C4_OBS_01_SEED: SkillSeed = {
  identity: C4_OBS_01_IDENTITY,
  dataset: C4_OBS_01_DATASET,
  levels: [
    {
      code: "GL-C4-OBS-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
