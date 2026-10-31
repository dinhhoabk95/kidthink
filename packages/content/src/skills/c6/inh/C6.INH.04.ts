import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INH_04_IDENTITY: SkillIdentity = {
  code: "C6.INH.04",
  strand_code: "C6.INH",
  competency_code: "C6",
  name: "Đi tiếp hay dừng lại",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["inhibit"],
  tier: "advanced",
  prerequisites: ["C6.INH.03"],
  learning_objectives: [
    {
      code: "LO-C6.INH.04-01",
      behaviour: "Nhận biết và thực hành Go / No-Go ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INH.04-02",
      behaviour: "Vận dụng Go / No-Go trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INH.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Go / No-Go",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INH_04_DATASET: SkillDataset = {
  skill_code: "C6.INH.04",
  concept_label: "Đi tiếp hay dừng lại",
  surface: "game",
  items: [
    {
      id: "green_circle",
      label: "chấm xanh",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🟢",
      },
      category: {
        type: "tín hiệu đi",
        color: "green",
        shape: "circle",
      },
      contrast_group: "go",
    },
    {
      id: "blue_square",
      label: "ô lam",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "tín hiệu đi",
        color: "blue",
        shape: "square",
      },
      contrast_group: "go",
    },
    {
      id: "yellow_star",
      label: "sao vàng",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "tín hiệu đi",
        color: "yellow",
        shape: "star",
      },
      contrast_group: "go",
    },
    {
      id: "sunny_smile",
      label: "nắng ấm",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "tín hiệu đi",
        color: "yellow",
        shape: "circle",
      },
      contrast_group: "go",
    },
    {
      id: "red_octagon",
      label: "biển dừng",
      value: 5,
      ordering: 5,
      image: {
        kind: "emoji",
        ref: "🛑",
      },
      category: {
        type: "tín hiệu dừng",
        color: "red",
        shape: "circle",
      },
      contrast_group: "nogo",
    },
    {
      id: "red_square",
      label: "ô đỏ",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "🟥",
      },
      category: {
        type: "tín hiệu dừng",
        color: "red",
        shape: "square",
      },
      contrast_group: "nogo",
    },
    {
      id: "dark_cloud",
      label: "mây xám",
      value: 7,
      ordering: 7,
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "tín hiệu dừng",
        color: "blue",
        shape: "triangle",
      },
      contrast_group: "nogo",
    },
    {
      id: "crescent_moon",
      label: "trăng ngủ",
      value: 8,
      ordering: 8,
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      category: {
        type: "tín hiệu dừng",
        color: "blue",
        shape: "star",
      },
      contrast_group: "nogo",
    },
  ],
  axes: {
    type: ["tín hiệu đi", "tín hiệu dừng"],
    color: ["red", "blue", "yellow", "green"],
    shape: ["circle", "square", "triangle", "star"],
  },
  relations: [
    {
      type: "contrast",
      source_id: "green_circle",
      target_id: "red_octagon",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "blue_square",
      target_id: "red_square",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "yellow_star",
      target_id: "dark_cloud",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "sunny_smile",
      target_id: "crescent_moon",
      metadata: { reason: "go_vs_nogo" },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đi tiếp hay dừng lại",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đi tiếp hay dừng lại",
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
      "Chúng mình cùng chú ý tín hiệu đi tiếp hay dừng lại nhé",
  },
  ordering: [
    "green_circle",
    "blue_square",
    "yellow_star",
    "sunny_smile",
    "red_octagon",
    "red_square",
    "dark_cloud",
    "crescent_moon",
  ],
};

export const C6_INH_04_SEED: SkillSeed = {
  identity: C6_INH_04_IDENTITY,
  dataset: C6_INH_04_DATASET,
  levels: [
    {
      code: "GL-C6-INH-STIK-0005",
      template: "GT-025",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-INH-ADD-0003",
      template: "GT-026",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-INH-SUB-0001",
      template: "GT-027",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C6-INH-HUNT-0010",
      template: "GT-037",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
  ],
};
