import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_01_IDENTITY: SkillIdentity = {
  code: "C4.MAT.01",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Thời tiết trong ngày",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe", "sort"],
  tier: "basic",
  prerequisites: ["C4.DET.01"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.01-01",
      behaviour: "Nhận biết và thực hành Thời tiết trong ngày ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.01-02",
      behaviour: "Vận dụng Thời tiết trong ngày trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thời tiết trong ngày",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_01_DATASET: SkillDataset = {
  skill_code: "C4.MAT.01",
  concept_label: "Thời tiết trong ngày",
  surface: "game",
  items: [
    {
      id: "wth_sun",
      label: "ông mặt trời",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "ngày nắng ráo",
      },
      contrast_group: "sunny",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/wth_sun.mp3",
    },
    {
      id: "wth_glasses",
      label: "kính râm mát",
      image: {
        kind: "emoji",
        ref: "🕶️",
      },
      category: {
        type: "ngày nắng ráo",
      },
      contrast_group: "sunny",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/wth_glasses.mp3",
    },
    {
      id: "wth_hat",
      label: "mũ che nắng",
      image: {
        kind: "emoji",
        ref: "👒",
      },
      category: {
        type: "ngày nắng ráo",
      },
      contrast_group: "sunny",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/wth_hat.mp3",
    },
    {
      id: "wth_fan",
      label: "chiếc quạt nan",
      image: {
        kind: "emoji",
        ref: "🪭",
      },
      category: {
        type: "ngày nắng ráo",
      },
      contrast_group: "sunny",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/wth_fan.mp3",
    },
    {
      id: "wth_rain",
      label: "đám mây mưa",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "ngày mưa rơi",
      },
      contrast_group: "rainy",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/wth_rain.mp3",
    },
    {
      id: "wth_umbrella",
      label: "chiếc ô che mưa",
      image: {
        kind: "emoji",
        ref: "☂️",
      },
      category: {
        type: "ngày mưa rơi",
      },
      contrast_group: "rainy",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/wth_umbrella.mp3",
    },
    {
      id: "wth_coat",
      label: "chiếc áo mưa",
      image: {
        kind: "emoji",
        ref: "🧥",
      },
      category: {
        type: "ngày mưa rơi",
      },
      contrast_group: "rainy",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/wth_coat.mp3",
    },
    {
      id: "wth_boots",
      label: "đôi ủng đi mưa",
      image: {
        kind: "emoji",
        ref: "👢",
      },
      category: {
        type: "ngày mưa rơi",
      },
      contrast_group: "rainy",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/wth_boots.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "wth_sun",
      target_id: "wth_rain",
    },
    {
      type: "contrast",
      source_id: "wth_glasses",
      target_id: "wth_umbrella",
    },
    {
      type: "contrast",
      source_id: "wth_hat",
      target_id: "wth_coat",
    },
    {
      type: "contrast",
      source_id: "wth_fan",
      target_id: "wth_boots",
    },
  ],
  axes: {
    weather_type: {
      values: ["ngày nắng ráo", "ngày mưa rơi"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Thời tiết trong ngày",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thời tiết trong ngày",
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
    narration_template: "Chúng mình cùng tìm hiểu về Thời tiết trong ngày nhé",
  },
  ordering: [
    "wth_sun",
    "wth_glasses",
    "wth_hat",
    "wth_fan",
    "wth_rain",
    "wth_umbrella",
    "wth_coat",
    "wth_boots",
  ],
};

export const C4_MAT_01_SEED: SkillSeed = {
  identity: C4_MAT_01_IDENTITY,
  dataset: C4_MAT_01_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
  ],
};
