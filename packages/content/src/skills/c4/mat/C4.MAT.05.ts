import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_05_IDENTITY: SkillIdentity = {
  code: "C4.MAT.05",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Nước: lỏng · đá · hơi",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "predict"],
  tier: "core",
  prerequisites: ["C4.MAT.02", "C4.EXP.01"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.05-01",
      behaviour: "Nhận biết và thực hành Nước: lỏng · đá · hơi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.05-02",
      behaviour: "Vận dụng Nước: lỏng · đá · hơi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nước: lỏng · đá · hơi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_05_DATASET: SkillDataset = {
  skill_code: "C4.MAT.05",
  concept_label: "Nước: lỏng · đá · hơi",
  surface: "game",
  items: [
    {
      id: "liq_glass",
      label: "ly nước uống",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "nước thể lỏng",
      },
      contrast_group: "liquid",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/liq_glass.mp3",
    },
    {
      id: "liq_drop",
      label: "giọt nước mưa",
      image: {
        kind: "emoji",
        ref: "💧",
      },
      category: {
        type: "nước thể lỏng",
      },
      contrast_group: "liquid",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/liq_drop.mp3",
    },
    {
      id: "liq_river",
      label: "dòng sông xanh",
      image: {
        kind: "emoji",
        ref: "🌊",
      },
      category: {
        type: "nước thể lỏng",
      },
      contrast_group: "liquid",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/liq_river.mp3",
    },
    {
      id: "liq_bottle",
      label: "bình nước lọc",
      image: {
        kind: "emoji",
        ref: "🍶",
      },
      category: {
        type: "nước thể lỏng",
      },
      contrast_group: "liquid",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/liq_bottle.mp3",
    },
    {
      id: "sld_ice",
      label: "viên đá lạnh",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "đá và hơi",
      },
      contrast_group: "solid_gas",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/sld_ice.mp3",
    },
    {
      id: "sld_cream",
      label: "cây kem đông",
      image: {
        kind: "emoji",
        ref: "🍦",
      },
      category: {
        type: "đá và hơi",
      },
      contrast_group: "solid_gas",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/sld_cream.mp3",
    },
    {
      id: "stm_cloud",
      label: "đám mây hơi nước",
      image: {
        kind: "emoji",
        ref: "☁️",
      },
      category: {
        type: "đá và hơi",
      },
      contrast_group: "solid_gas",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/stm_cloud.mp3",
    },
    {
      id: "stm_steam",
      label: "làn hơi ấm",
      image: {
        kind: "emoji",
        ref: "♨️",
      },
      category: {
        type: "đá và hơi",
      },
      contrast_group: "solid_gas",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/stm_steam.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "liq_glass",
      target_id: "sld_ice",
    },
    {
      type: "contrast",
      source_id: "liq_drop",
      target_id: "stm_cloud",
    },
    {
      type: "contrast",
      source_id: "liq_river",
      target_id: "sld_cream",
    },
    {
      type: "contrast",
      source_id: "liq_bottle",
      target_id: "stm_steam",
    },
  ],
  axes: {
    water_state: {
      values: ["nước thể lỏng", "đá và hơi"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nước: lỏng · đá · hơi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nước: lỏng · đá · hơi",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nước: lỏng · đá · hơi nhé",
  },
  ordering: [
    "liq_glass",
    "liq_drop",
    "liq_river",
    "liq_bottle",
    "sld_ice",
    "sld_cream",
    "stm_cloud",
    "stm_steam",
  ],
};

export const C4_MAT_05_SEED: SkillSeed = {
  identity: C4_MAT_05_IDENTITY,
  dataset: C4_MAT_05_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
  ],
};
