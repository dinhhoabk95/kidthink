import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TAC_03_IDENTITY: SkillIdentity = {
  code: "C4.TAC.03",
  strand_code: "C4.TAC",
  competency_code: "C4",
  name: "Nóng – lạnh",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["compare", "observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.TAC.03-01",
      behaviour: "Nhận biết và thực hành Nóng – lạnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TAC.03-02",
      behaviour: "Vận dụng Nóng – lạnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TAC.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nóng – lạnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TAC_03_DATASET: SkillDataset = {
  skill_code: "C4.TAC.03",
  concept_label: "Nóng – lạnh",
  surface: "game",
  items: [
    {
      id: "ice_cube",
      label: "viên đá lạnh",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "vật mát lạnh",
      },
      value: 1,
      ordering: 1,
      contrast_group: "cold",
      audio_path: "/audio/vi/c4/ice_cube.mp3",
    },
    {
      id: "snowflake",
      label: "bông tuyết lạnh",
      image: {
        kind: "emoji",
        ref: "❄️",
      },
      category: {
        type: "vật mát lạnh",
      },
      value: 2,
      ordering: 2,
      contrast_group: "cold",
      audio_path: "/audio/vi/c4/snowflake.mp3",
    },
    {
      id: "ice_cream",
      label: "que kem mát",
      image: {
        kind: "emoji",
        ref: "🍦",
      },
      category: {
        type: "vật mát lạnh",
      },
      value: 3,
      ordering: 3,
      contrast_group: "cold",
      audio_path: "/audio/vi/c4/ice_cream.mp3",
    },
    {
      id: "cold_drink",
      label: "cốc nước đá",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "vật mát lạnh",
      },
      value: 4,
      ordering: 4,
      contrast_group: "cold",
      audio_path: "/audio/vi/c4/cold_drink.mp3",
    },
    {
      id: "warm_milk",
      label: "cốc sữa ấm",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "vật ấm nóng",
      },
      value: 5,
      ordering: 5,
      contrast_group: "hot",
      audio_path: "/audio/vi/c4/warm_milk.mp3",
    },
    {
      id: "hot_soup",
      label: "bát súp nóng",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "vật ấm nóng",
      },
      value: 6,
      ordering: 6,
      contrast_group: "hot",
      audio_path: "/audio/vi/c4/hot_soup.mp3",
    },
    {
      id: "hot_tea",
      label: "ấm trà nóng",
      image: {
        kind: "emoji",
        ref: "🫖",
      },
      category: {
        type: "vật ấm nóng",
      },
      value: 7,
      ordering: 7,
      contrast_group: "hot",
      audio_path: "/audio/vi/c4/hot_tea.mp3",
    },
    {
      id: "warm_sun",
      label: "mặt trời ấm",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "vật ấm nóng",
      },
      value: 8,
      ordering: 8,
      contrast_group: "hot",
      audio_path: "/audio/vi/c4/warm_sun.mp3",
    },
  ],
  axes: {
    category: {
      values: ["vật mát lạnh", "vật ấm nóng"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "ice_cube",
      target_id: "warm_sun",
    },
    {
      type: "contrast",
      source_id: "snowflake",
      target_id: "hot_tea",
    },
    {
      type: "contrast",
      source_id: "ice_cream",
      target_id: "hot_soup",
    },
    {
      type: "contrast",
      source_id: "cold_drink",
      target_id: "warm_milk",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nóng – lạnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nóng – lạnh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nóng – lạnh nhé",
  },
  ordering: [
    "ice_cube",
    "snowflake",
    "ice_cream",
    "cold_drink",
    "warm_milk",
    "hot_soup",
    "hot_tea",
    "warm_sun",
  ],
};

export const C4_TAC_03_SEED: SkillSeed = {
  identity: C4_TAC_03_IDENTITY,
  dataset: C4_TAC_03_DATASET,
  levels: [
    {
      code: "GL-C4-TAC-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
  ],
};
