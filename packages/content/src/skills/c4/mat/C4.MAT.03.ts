import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_03_IDENTITY: SkillIdentity = {
  code: "C4.MAT.03",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Ngày và đêm",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "sequence"],
  tier: "basic",
  prerequisites: ["C1.MEAS.12"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.03-01",
      behaviour: "Nhận biết và thực hành Ngày và đêm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.03-02",
      behaviour: "Vận dụng Ngày và đêm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ngày và đêm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_03_DATASET: SkillDataset = {
  skill_code: "C4.MAT.03",
  concept_label: "Ngày và đêm",
  surface: "game",
  items: [
    {
      id: "tod_sun",
      label: "mặt trời tỏa sáng",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "cảnh ban ngày",
      },
      contrast_group: "day",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/tod_sun.mp3",
    },
    {
      id: "tod_rooster",
      label: "gà gáy báo thức",
      image: {
        kind: "emoji",
        ref: "🐓",
      },
      category: {
        type: "cảnh ban ngày",
      },
      contrast_group: "day",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/tod_rooster.mp3",
    },
    {
      id: "tod_school",
      label: "cặp sách học",
      image: {
        kind: "emoji",
        ref: "🏫",
      },
      category: {
        type: "cảnh ban ngày",
      },
      contrast_group: "day",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/tod_school.mp3",
    },
    {
      id: "tod_rainbow",
      label: "cầu vồng rực rỡ",
      image: {
        kind: "emoji",
        ref: "🌈",
      },
      category: {
        type: "cảnh ban ngày",
      },
      contrast_group: "day",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/tod_rainbow.mp3",
    },
    {
      id: "tod_moon",
      label: "mặt trăng soi sáng",
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      category: {
        type: "cảnh ban đêm",
      },
      contrast_group: "night",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/tod_moon.mp3",
    },
    {
      id: "tod_stars",
      label: "ngôi sao lấp lánh",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "cảnh ban đêm",
      },
      contrast_group: "night",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/tod_stars.mp3",
    },
    {
      id: "tod_owl",
      label: "chú cú mèo",
      image: {
        kind: "emoji",
        ref: "🦉",
      },
      category: {
        type: "cảnh ban đêm",
      },
      contrast_group: "night",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/tod_owl.mp3",
    },
    {
      id: "tod_sleep",
      label: "giường ngủ êm",
      image: {
        kind: "emoji",
        ref: "🛌",
      },
      category: {
        type: "cảnh ban đêm",
      },
      contrast_group: "night",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/tod_sleep.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "tod_sun",
      target_id: "tod_moon",
    },
    {
      type: "contrast",
      source_id: "tod_rooster",
      target_id: "tod_owl",
    },
    {
      type: "contrast",
      source_id: "tod_school",
      target_id: "tod_sleep",
    },
    {
      type: "contrast",
      source_id: "tod_rainbow",
      target_id: "tod_stars",
    },
  ],
  axes: {
    time_of_day: {
      values: ["cảnh ban ngày", "cảnh ban đêm"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ngày và đêm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ngày và đêm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ngày và đêm nhé",
  },
  ordering: [
    "tod_sun",
    "tod_rooster",
    "tod_school",
    "tod_rainbow",
    "tod_moon",
    "tod_stars",
    "tod_owl",
    "tod_sleep",
  ],
};

export const C4_MAT_03_SEED: SkillSeed = {
  identity: C4_MAT_03_IDENTITY,
  dataset: C4_MAT_03_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
  ],
};
