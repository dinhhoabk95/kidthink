import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_04_IDENTITY: SkillIdentity = {
  code: "C4.MAT.04",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Bốn mùa",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sort", "sequence"],
  tier: "core",
  prerequisites: ["C4.MAT.01"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.04-01",
      behaviour: "Nhận biết và thực hành Bốn mùa ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.04-02",
      behaviour: "Vận dụng Bốn mùa trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Bốn mùa",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_04_DATASET: SkillDataset = {
  skill_code: "C4.MAT.04",
  concept_label: "Bốn mùa",
  surface: "game",
  items: [
    {
      id: "sea_spring_flower",
      label: "hoa nở mùa xuân",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "mùa ấm nóng",
      },
      contrast_group: "warm",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/sea_spring_flower.mp3",
    },
    {
      id: "sea_spring_sprout",
      label: "chồi non mùa xuân",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "mùa ấm nóng",
      },
      contrast_group: "warm",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/sea_spring_sprout.mp3",
    },
    {
      id: "sea_summer_sun",
      label: "nắng hè rực rỡ",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "mùa ấm nóng",
      },
      contrast_group: "warm",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/sea_summer_sun.mp3",
    },
    {
      id: "sea_summer_swim",
      label: "áo bơi mùa hè",
      image: {
        kind: "emoji",
        ref: "🩱",
      },
      category: {
        type: "mùa ấm nóng",
      },
      contrast_group: "warm",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/sea_summer_swim.mp3",
    },
    {
      id: "sea_autumn_leaf",
      label: "lá vàng mùa thu",
      image: {
        kind: "emoji",
        ref: "🍂",
      },
      category: {
        type: "mùa mát lạnh",
      },
      contrast_group: "cold",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/sea_autumn_leaf.mp3",
    },
    {
      id: "sea_autumn_moon",
      label: "trăng rằm mùa thu",
      image: {
        kind: "emoji",
        ref: "🌕",
      },
      category: {
        type: "mùa mát lạnh",
      },
      contrast_group: "cold",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/sea_autumn_moon.mp3",
    },
    {
      id: "sea_winter_snow",
      label: "tuyết rơi mùa đông",
      image: {
        kind: "emoji",
        ref: "❄️",
      },
      category: {
        type: "mùa mát lạnh",
      },
      contrast_group: "cold",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/sea_winter_snow.mp3",
    },
    {
      id: "sea_winter_scarf",
      label: "khăn ấm mùa đông",
      image: {
        kind: "emoji",
        ref: "🧣",
      },
      category: {
        type: "mùa mát lạnh",
      },
      contrast_group: "cold",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/sea_winter_scarf.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "sea_spring_flower",
      target_id: "sea_autumn_leaf",
    },
    {
      type: "contrast",
      source_id: "sea_spring_sprout",
      target_id: "sea_winter_snow",
    },
    {
      type: "contrast",
      source_id: "sea_summer_sun",
      target_id: "sea_winter_scarf",
    },
    {
      type: "contrast",
      source_id: "sea_summer_swim",
      target_id: "sea_autumn_moon",
    },
  ],
  axes: {
    seasons: {
      values: ["mùa ấm nóng", "mùa mát lạnh"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Bốn mùa",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Bốn mùa",
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
    narration_template: "Chúng mình cùng tìm hiểu về Bốn mùa nhé",
  },
  ordering: [
    "sea_spring_flower",
    "sea_spring_sprout",
    "sea_summer_sun",
    "sea_summer_swim",
    "sea_autumn_leaf",
    "sea_autumn_moon",
    "sea_winter_snow",
    "sea_winter_scarf",
  ],
};

export const C4_MAT_04_SEED: SkillSeed = {
  identity: C4_MAT_04_IDENTITY,
  dataset: C4_MAT_04_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0007",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
