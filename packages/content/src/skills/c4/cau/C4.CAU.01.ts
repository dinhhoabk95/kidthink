import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_CAU_01_IDENTITY: SkillIdentity = {
  code: "C4.CAU.01",
  strand_code: "C4.CAU",
  competency_code: "C4",
  name: "Điều gì xảy ra tiếp theo",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["predict", "infer"],
  tier: "core",
  prerequisites: ["C3.SEQ.03"],
  learning_objectives: [
    {
      code: "LO-C4.CAU.01-01",
      behaviour: "Nhận biết và thực hành Điều gì xảy ra tiếp theo ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.CAU.01-02",
      behaviour: "Vận dụng Điều gì xảy ra tiếp theo trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.CAU.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Điều gì xảy ra tiếp theo",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_CAU_01_DATASET: SkillDataset = {
  skill_code: "C4.CAU.01",
  concept_label: "Điều gì xảy ra tiếp theo",
  surface: "game",
  items: [
    {
      id: "cau_rain",
      label: "cơn mưa rào",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "nguyên nhân",
      },
      contrast_group: "cause",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/cau_rain.mp3",
    },
    {
      id: "cau_sun",
      label: "nắng sau mưa",
      image: {
        kind: "emoji",
        ref: "🌦️",
      },
      category: {
        type: "nguyên nhân",
      },
      contrast_group: "cause",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/cau_sun.mp3",
    },
    {
      id: "cau_seed",
      label: "hạt mầm gieo",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "nguyên nhân",
      },
      contrast_group: "cause",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/cau_seed.mp3",
    },
    {
      id: "cau_heat_ice",
      label: "viên đá lạnh",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "nguyên nhân",
      },
      contrast_group: "cause",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/cau_heat_ice.mp3",
    },
    {
      id: "eff_puddle",
      label: "vũng nước mưa",
      image: {
        kind: "emoji",
        ref: "💧",
      },
      category: {
        type: "kết quả",
      },
      contrast_group: "effect",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/eff_puddle.mp3",
    },
    {
      id: "eff_rainbow",
      label: "cầu vồng rực rỡ",
      image: {
        kind: "emoji",
        ref: "🌈",
      },
      category: {
        type: "kết quả",
      },
      contrast_group: "effect",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/eff_rainbow.mp3",
    },
    {
      id: "eff_flower",
      label: "bông hoa nở",
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      category: {
        type: "kết quả",
      },
      contrast_group: "effect",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/eff_flower.mp3",
    },
    {
      id: "eff_water",
      label: "giọt nước tan",
      image: {
        kind: "emoji",
        ref: "💦",
      },
      category: {
        type: "kết quả",
      },
      contrast_group: "effect",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/eff_water.mp3",
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "cau_rain",
      target_id: "eff_puddle",
    },
    {
      type: "pair",
      source_id: "cau_sun",
      target_id: "eff_rainbow",
    },
    {
      type: "pair",
      source_id: "cau_seed",
      target_id: "eff_flower",
    },
    {
      type: "pair",
      source_id: "cau_heat_ice",
      target_id: "eff_water",
    },
  ],
  axes: {
    stage: {
      values: ["nguyên nhân", "kết quả"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Điều gì xảy ra tiếp theo",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Điều gì xảy ra tiếp theo",
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
      "Chúng mình cùng tìm hiểu về Điều gì xảy ra tiếp theo nhé",
  },
  ordering: [
    "cau_rain",
    "cau_sun",
    "cau_seed",
    "cau_heat_ice",
    "eff_puddle",
    "eff_rainbow",
    "eff_flower",
    "eff_water",
  ],
};

export const C4_CAU_01_SEED: SkillSeed = {
  identity: C4_CAU_01_IDENTITY,
  dataset: C4_CAU_01_DATASET,
  levels: [
    {
      code: "GL-C4-CAU-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
  ],
};
