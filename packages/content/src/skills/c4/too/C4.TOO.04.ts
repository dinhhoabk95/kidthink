import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TOO_04_IDENTITY: SkillIdentity = {
  code: "C4.TOO.04",
  strand_code: "C4.TOO",
  competency_code: "C4",
  name: "Cân và thước",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["count", "verify"],
  tier: "core",
  prerequisites: ["C1.MEAS.07", "C1.MEAS.08"],
  learning_objectives: [
    {
      code: "LO-C4.TOO.04-01",
      behaviour: "Nhận biết và thực hành Cân và thước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TOO.04-02",
      behaviour: "Vận dụng Cân và thước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TOO.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cân và thước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TOO_04_DATASET: SkillDataset = {
  skill_code: "C4.TOO.04",
  concept_label: "Cân và thước",
  surface: "game",
  items: [
    {
      id: "ruler",
      label: "thước kẻ thẳng",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "thước đo dài",
      },
      value: 1,
      ordering: 1,
      contrast_group: "length",
      audio_path: "/audio/vi/c4/ruler.mp3",
    },
    {
      id: "tape_measure",
      label: "thước tam giác",
      image: {
        kind: "emoji",
        ref: "📐",
      },
      category: {
        type: "thước đo dài",
      },
      value: 2,
      ordering: 2,
      contrast_group: "length",
      audio_path: "/audio/vi/c4/tape_measure.mp3",
    },
    {
      id: "pencil_mark",
      label: "thước dây mềm",
      image: {
        kind: "emoji",
        ref: "🎗️",
      },
      category: {
        type: "thước đo dài",
      },
      value: 3,
      ordering: 3,
      contrast_group: "length",
      audio_path: "/audio/vi/c4/pencil_mark.mp3",
    },
    {
      id: "tool_box",
      label: "thanh đo dài",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "thước đo dài",
      },
      value: 4,
      ordering: 4,
      contrast_group: "length",
      audio_path: "/audio/vi/c4/tool_box.mp3",
    },
    {
      id: "digital_scale",
      label: "chiếc cân đĩa",
      image: {
        kind: "emoji",
        ref: "⚖️",
      },
      category: {
        type: "vật đo nặng",
      },
      value: 1,
      ordering: 5,
      contrast_group: "weight",
      audio_path: "/audio/vi/c4/digital_scale.mp3",
    },
    {
      id: "stopwatch",
      label: "quả cân sắt",
      image: {
        kind: "emoji",
        ref: "⚓",
      },
      category: {
        type: "vật đo nặng",
      },
      value: 2,
      ordering: 6,
      contrast_group: "weight",
      audio_path: "/audio/vi/c4/stopwatch.mp3",
    },
    {
      id: "wall_clock",
      label: "quả dưa nặng",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "vật đo nặng",
      },
      value: 3,
      ordering: 7,
      contrast_group: "weight",
      audio_path: "/audio/vi/c4/wall_clock.mp3",
    },
    {
      id: "thermometer",
      label: "bao gạo nặng",
      image: {
        kind: "emoji",
        ref: "🌾",
      },
      category: {
        type: "vật đo nặng",
      },
      value: 4,
      ordering: 8,
      contrast_group: "weight",
      audio_path: "/audio/vi/c4/thermometer.mp3",
    },
  ],
  axes: {
    category: {
      values: ["thước đo dài", "vật đo nặng"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "ruler",
      target_id: "digital_scale",
    },
    {
      type: "contrast",
      source_id: "tape_measure",
      target_id: "stopwatch",
    },
    {
      type: "contrast",
      source_id: "pencil_mark",
      target_id: "wall_clock",
    },
    {
      type: "contrast",
      source_id: "tool_box",
      target_id: "thermometer",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Cân và thước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Cân và thước",
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
    narration_template: "Chúng mình cùng tìm hiểu về Cân và thước nhé",
  },
  ordering: [
    "ruler",
    "tape_measure",
    "pencil_mark",
    "tool_box",
    "digital_scale",
    "stopwatch",
    "wall_clock",
    "thermometer",
  ],
};

export const C4_TOO_04_SEED: SkillSeed = {
  identity: C4_TOO_04_IDENTITY,
  dataset: C4_TOO_04_DATASET,
  levels: [
    {
      code: "GL-C4-TOO-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SHAD-0006",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-MEMO-0001",
      template: "GT-012",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-MEMO-0002",
      template: "GT-012",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
  ],
};
