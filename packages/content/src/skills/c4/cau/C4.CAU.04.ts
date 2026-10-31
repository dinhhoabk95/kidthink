import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_CAU_04_IDENTITY: SkillIdentity = {
  code: "C4.CAU.04",
  strand_code: "C4.CAU",
  competency_code: "C4",
  name: "Suy nguyên nhân bị che",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "deduce"],
  tier: "advanced",
  prerequisites: ["C4.CAU.03"],
  learning_objectives: [
    {
      code: "LO-C4.CAU.04-01",
      behaviour: "Nhận biết và thực hành Suy nguyên nhân bị che ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.CAU.04-02",
      behaviour: "Vận dụng Suy nguyên nhân bị che trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.CAU.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Suy nguyên nhân bị che",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_CAU_04_DATASET: SkillDataset = {
  skill_code: "C4.CAU.04",
  concept_label: "Suy nguyên nhân bị che",
  surface: "game",
  items: [
    {
      id: "cue_paw",
      label: "dấu chân nhỏ",
      image: {
        kind: "emoji",
        ref: "🐾",
      },
      category: {
        type: "dấu vết thấy",
      },
      contrast_group: "clue",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/cue_paw.mp3",
    },
    {
      id: "cue_smoke",
      label: "vệt khói bốc",
      image: {
        kind: "emoji",
        ref: "💨",
      },
      category: {
        type: "dấu vết thấy",
      },
      contrast_group: "clue",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/cue_smoke.mp3",
    },
    {
      id: "cue_puddle",
      label: "vũng nước đổ",
      image: {
        kind: "emoji",
        ref: "💧",
      },
      category: {
        type: "dấu vết thấy",
      },
      contrast_group: "clue",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/cue_puddle.mp3",
    },
    {
      id: "cue_fallen",
      label: "lá rụng nhiều",
      image: {
        kind: "emoji",
        ref: "🍂",
      },
      category: {
        type: "dấu vết thấy",
      },
      contrast_group: "clue",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/cue_fallen.mp3",
    },
    {
      id: "hid_puppy",
      label: "chú cún con",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "nguyên nhân ẩn",
      },
      contrast_group: "cause",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/hid_puppy.mp3",
    },
    {
      id: "hid_fire",
      label: "bếp lửa ấm",
      image: {
        kind: "emoji",
        ref: "🔥",
      },
      category: {
        type: "nguyên nhân ẩn",
      },
      contrast_group: "cause",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/hid_fire.mp3",
    },
    {
      id: "hid_cup",
      label: "chiếc cốc đổ",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "nguyên nhân ẩn",
      },
      contrast_group: "cause",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/hid_cup.mp3",
    },
    {
      id: "hid_wind",
      label: "cơn gió mạnh",
      image: {
        kind: "emoji",
        ref: "🌬️",
      },
      category: {
        type: "nguyên nhân ẩn",
      },
      contrast_group: "cause",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/hid_wind.mp3",
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "cue_paw",
      target_id: "hid_puppy",
    },
    {
      type: "pair",
      source_id: "cue_smoke",
      target_id: "hid_fire",
    },
    {
      type: "pair",
      source_id: "cue_puddle",
      target_id: "hid_cup",
    },
    {
      type: "pair",
      source_id: "cue_fallen",
      target_id: "hid_wind",
    },
  ],
  axes: {
    clue_group: {
      values: ["dấu vết thấy", "nguyên nhân ẩn"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Suy nguyên nhân bị che",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Suy nguyên nhân bị che",
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
      "Chúng mình cùng tìm hiểu về Suy nguyên nhân bị che nhé",
  },
  ordering: [
    "cue_paw",
    "cue_smoke",
    "cue_puddle",
    "cue_fallen",
    "hid_puppy",
    "hid_fire",
    "hid_cup",
    "hid_wind",
  ],
};

export const C4_CAU_04_SEED: SkillSeed = {
  identity: C4_CAU_04_IDENTITY,
  dataset: C4_CAU_04_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C4-CAU-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 2,
      theme: "home",
    },
    {
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
    {
      template: "GT-032",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
  ],
};
