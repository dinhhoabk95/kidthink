import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_ECO_02_IDENTITY: SkillIdentity = {
  code: "C4.ECO.02",
  strand_code: "C4.ECO",
  competency_code: "C4",
  name: "Chăm cây, chăm con vật",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["plan", "describe"],
  tier: "basic",
  prerequisites: ["C4.LIV.01"],
  learning_objectives: [
    {
      code: "LO-C4.ECO.02-01",
      behaviour: "Nhận biết và thực hành Chăm cây, chăm con vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.ECO.02-02",
      behaviour: "Vận dụng Chăm cây, chăm con vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.ECO.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chăm cây, chăm con vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_ECO_02_DATASET: SkillDataset = {
  skill_code: "C4.ECO.02",
  concept_label: "Chăm cây, chăm con vật",
  surface: "game",
  items: [
    {
      id: "care_plant_water",
      label: "chậu cây xanh",
      image: {
        kind: "emoji",
        ref: "🪴",
      },
      category: {
        type: "chăm sóc cây",
      },
      contrast_group: "plant",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/care_plant_water.mp3",
    },
    {
      id: "care_plant_sun",
      label: "ánh nắng ấm",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "chăm sóc cây",
      },
      contrast_group: "plant",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/care_plant_sun.mp3",
    },
    {
      id: "care_plant_leaf",
      label: "chiếc lá xanh",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "chăm sóc cây",
      },
      contrast_group: "plant",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/care_plant_leaf.mp3",
    },
    {
      id: "care_plant_soil",
      label: "mầm cây non",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "chăm sóc cây",
      },
      contrast_group: "plant",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/care_plant_soil.mp3",
    },
    {
      id: "care_pet_food",
      label: "bát thức ăn",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "chăm con vật",
      },
      contrast_group: "pet",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/care_pet_food.mp3",
    },
    {
      id: "care_pet_water",
      label: "ly nước sạch",
      image: {
        kind: "emoji",
        ref: "🫗",
      },
      category: {
        type: "chăm con vật",
      },
      contrast_group: "pet",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/care_pet_water.mp3",
    },
    {
      id: "care_pet_comb",
      label: "lược chải lông",
      image: {
        kind: "emoji",
        ref: "🪮",
      },
      category: {
        type: "chăm con vật",
      },
      contrast_group: "pet",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/care_pet_comb.mp3",
    },
    {
      id: "care_pet_bed",
      label: "đệm ngủ êm",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "chăm con vật",
      },
      contrast_group: "pet",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/care_pet_bed.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "care_plant_water",
      target_id: "care_pet_food",
    },
    {
      type: "contrast",
      source_id: "care_plant_sun",
      target_id: "care_pet_water",
    },
    {
      type: "contrast",
      source_id: "care_plant_leaf",
      target_id: "care_pet_comb",
    },
    {
      type: "contrast",
      source_id: "care_plant_soil",
      target_id: "care_pet_bed",
    },
  ],
  axes: {
    care_target: {
      values: ["chăm sóc cây", "chăm con vật"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chăm cây, chăm con vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chăm cây, chăm con vật",
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
      "Chúng mình cùng tìm hiểu về Chăm cây, chăm con vật nhé",
  },
  ordering: [
    "care_plant_water",
    "care_plant_sun",
    "care_plant_leaf",
    "care_plant_soil",
    "care_pet_food",
    "care_pet_water",
    "care_pet_comb",
    "care_pet_bed",
  ],
};

export const C4_ECO_02_SEED: SkillSeed = {
  identity: C4_ECO_02_IDENTITY,
  dataset: C4_ECO_02_DATASET,
  levels: [
    {
      code: "GL-C4-ECO-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
  ],
};
