import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_OBS_03_IDENTITY: SkillIdentity = {
  code: "C4.OBS.03",
  strand_code: "C4.OBS",
  competency_code: "C4",
  name: "Quan sát nhiều lần, thấy đổi thay",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "sequence"],
  tier: "core",
  prerequisites: ["C4.OBS.02"],
  learning_objectives: [
    {
      code: "LO-C4.OBS.03-01",
      behaviour:
        "Nhận biết và thực hành Quan sát nhiều lần, thấy đổi thay ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.OBS.03-02",
      behaviour:
        "Vận dụng Quan sát nhiều lần, thấy đổi thay trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.OBS.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Quan sát nhiều lần, thấy đổi thay",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_OBS_03_DATASET: SkillDataset = {
  skill_code: "C4.OBS.03",
  concept_label: "Quan sát nhiều lần, thấy đổi thay",
  surface: "game",
  items: [
    {
      id: "sunrise",
      label: "bình minh sớm",
      image: {
        kind: "emoji",
        ref: "🌅",
      },
      category: {
        type: "cảnh ban ngày",
      },
      value: 1,
      ordering: 1,
      contrast_group: "day",
      audio_path: "/audio/vi/c4/sunrise.mp3",
    },
    {
      id: "sun",
      label: "nắng ban trưa",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "cảnh ban ngày",
      },
      value: 2,
      ordering: 2,
      contrast_group: "day",
      audio_path: "/audio/vi/c4/sun.mp3",
    },
    {
      id: "sunset",
      label: "hoàng hôn chiều",
      image: {
        kind: "emoji",
        ref: "🌇",
      },
      category: {
        type: "cảnh ban ngày",
      },
      value: 3,
      ordering: 3,
      contrast_group: "day",
      audio_path: "/audio/vi/c4/sunset.mp3",
    },
    {
      id: "rainbow",
      label: "cầu vồng mưa",
      image: {
        kind: "emoji",
        ref: "🌈",
      },
      category: {
        type: "cảnh ban ngày",
      },
      value: 4,
      ordering: 4,
      contrast_group: "day",
      audio_path: "/audio/vi/c4/rainbow.mp3",
    },
    {
      id: "full_moon",
      label: "ánh trăng tròn",
      image: {
        kind: "emoji",
        ref: "🌕",
      },
      category: {
        type: "cảnh ban đêm",
      },
      value: 1,
      ordering: 5,
      contrast_group: "night",
      audio_path: "/audio/vi/c4/full_moon.mp3",
    },
    {
      id: "crescent_moon",
      label: "mặt trăng khuyết",
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      category: {
        type: "cảnh ban đêm",
      },
      value: 2,
      ordering: 6,
      contrast_group: "night",
      audio_path: "/audio/vi/c4/crescent_moon.mp3",
    },
    {
      id: "night_stars",
      label: "ngôi sao đêm",
      image: {
        kind: "emoji",
        ref: "🌌",
      },
      category: {
        type: "cảnh ban đêm",
      },
      value: 3,
      ordering: 7,
      contrast_group: "night",
      audio_path: "/audio/vi/c4/night_stars.mp3",
    },
    {
      id: "cloudy_night",
      label: "mây trời đêm",
      image: {
        kind: "emoji",
        ref: "☁️",
      },
      category: {
        type: "cảnh ban đêm",
      },
      value: 4,
      ordering: 8,
      contrast_group: "night",
      audio_path: "/audio/vi/c4/cloudy_night.mp3",
    },
  ],
  axes: {
    category: {
      values: ["cảnh ban ngày", "cảnh ban đêm"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "sunrise",
      target_id: "full_moon",
    },
    {
      type: "contrast",
      source_id: "sun",
      target_id: "crescent_moon",
    },
    {
      type: "contrast",
      source_id: "sunset",
      target_id: "night_stars",
    },
    {
      type: "contrast",
      source_id: "rainbow",
      target_id: "cloudy_night",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Quan sát nhiều lần, thấy đổi thay",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Quan sát nhiều lần, thấy đổi thay",
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
      "Chúng mình cùng tìm hiểu về Quan sát nhiều lần, thấy đổi thay nhé",
  },
  ordering: [
    "sunrise",
    "sun",
    "sunset",
    "rainbow",
    "full_moon",
    "crescent_moon",
    "night_stars",
    "cloudy_night",
  ],
};

export const C4_OBS_03_SEED: SkillSeed = {
  identity: C4_OBS_03_IDENTITY,
  dataset: C4_OBS_03_DATASET,
  levels: [
    {
      code: "GL-C4-OBS-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
