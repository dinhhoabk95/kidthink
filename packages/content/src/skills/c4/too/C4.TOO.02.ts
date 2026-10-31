import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TOO_02_IDENTITY: SkillIdentity = {
  code: "C4.TOO.02",
  strand_code: "C4.TOO",
  competency_code: "C4",
  name: "Chọn công cụ đúng việc",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["infer", "plan"],
  tier: "core",
  prerequisites: ["C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C4.TOO.02-01",
      behaviour: "Nhận biết và thực hành Chọn công cụ đúng việc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TOO.02-02",
      behaviour: "Vận dụng Chọn công cụ đúng việc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TOO.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn công cụ đúng việc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TOO_02_DATASET: SkillDataset = {
  skill_code: "C4.TOO.02",
  concept_label: "Chọn công cụ đúng việc",
  surface: "game",
  items: [
    {
      id: "magnifier",
      label: "kính lúp soi",
      image: {
        kind: "emoji",
        ref: "🔍",
      },
      category: {
        type: "dụng cụ đo",
      },
      value: 1,
      ordering: 1,
      contrast_group: "measure",
      audio_path: "/audio/vi/c4/magnifier.mp3",
    },
    {
      id: "ruler",
      label: "thước kẻ thẳng",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "dụng cụ đo",
      },
      value: 2,
      ordering: 2,
      contrast_group: "measure",
      audio_path: "/audio/vi/c4/ruler.mp3",
    },
    {
      id: "scale",
      label: "chiếc cân đĩa",
      image: {
        kind: "emoji",
        ref: "⚖️",
      },
      category: {
        type: "dụng cụ đo",
      },
      value: 3,
      ordering: 3,
      contrast_group: "measure",
      audio_path: "/audio/vi/c4/scale.mp3",
    },
    {
      id: "thermometer",
      label: "nhiệt kế ấm",
      image: {
        kind: "emoji",
        ref: "🌡️",
      },
      category: {
        type: "dụng cụ đo",
      },
      value: 4,
      ordering: 4,
      contrast_group: "measure",
      audio_path: "/audio/vi/c4/thermometer.mp3",
    },
    {
      id: "scissors",
      label: "chiếc kéo nhỏ",
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "đồ thủ công",
      },
      value: 1,
      ordering: 5,
      contrast_group: "craft",
      audio_path: "/audio/vi/c4/scissors.mp3",
    },
    {
      id: "hammer",
      label: "chiếc búa gõ",
      image: {
        kind: "emoji",
        ref: "🔨",
      },
      category: {
        type: "đồ thủ công",
      },
      value: 2,
      ordering: 6,
      contrast_group: "craft",
      audio_path: "/audio/vi/c4/hammer.mp3",
    },
    {
      id: "wrench",
      label: "chiếc cờ-lê",
      image: {
        kind: "emoji",
        ref: "🔧",
      },
      category: {
        type: "đồ thủ công",
      },
      value: 3,
      ordering: 7,
      contrast_group: "craft",
      audio_path: "/audio/vi/c4/wrench.mp3",
    },
    {
      id: "paintbrush",
      label: "chiếc cọ vẽ",
      image: {
        kind: "emoji",
        ref: "🖌️",
      },
      category: {
        type: "đồ thủ công",
      },
      value: 4,
      ordering: 8,
      contrast_group: "craft",
      audio_path: "/audio/vi/c4/paintbrush.mp3",
    },
  ],
  axes: {
    category: {
      values: ["dụng cụ đo", "đồ thủ công"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "magnifier",
      target_id: "scissors",
    },
    {
      type: "contrast",
      source_id: "ruler",
      target_id: "hammer",
    },
    {
      type: "contrast",
      source_id: "scale",
      target_id: "wrench",
    },
    {
      type: "contrast",
      source_id: "thermometer",
      target_id: "paintbrush",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chọn công cụ đúng việc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn công cụ đúng việc",
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
      "Chúng mình cùng tìm hiểu về Chọn công cụ đúng việc nhé",
  },
  ordering: [
    "magnifier",
    "ruler",
    "scale",
    "thermometer",
    "scissors",
    "hammer",
    "wrench",
    "paintbrush",
  ],
};

export const C4_TOO_02_SEED: SkillSeed = {
  identity: C4_TOO_02_IDENTITY,
  dataset: C4_TOO_02_DATASET,
  levels: [
    {
      code: "GL-C4-TOO-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
  ],
};
