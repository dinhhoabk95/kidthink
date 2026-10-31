import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INH_01_IDENTITY: SkillIdentity = {
  code: "C6.INH.01",
  strand_code: "C6.INH",
  competency_code: "C6",
  name: "Chọn đúng màu được phép",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["inhibit"],
  tier: "core",
  prerequisites: ["C3.CLS.01"],
  learning_objectives: [
    {
      code: "LO-C6.INH.01-01",
      behaviour: "Nhận biết và thực hành Không chọn màu bị cấm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INH.01-02",
      behaviour: "Vận dụng Không chọn màu bị cấm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INH.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Không chọn màu bị cấm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INH_01_DATASET: SkillDataset = {
  skill_code: "C6.INH.01",
  concept_label: "Chọn đúng màu được phép",
  surface: "game",
  items: [
    {
      id: "green_light",
      label: "đèn xanh",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🟢",
      },
      category: {
        type: "thẻ đi tiếp",
        color: "green",
        shape: "circle",
      },
      contrast_group: "go",
    },
    {
      id: "sun",
      label: "mặt trời",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "thẻ đi tiếp",
        color: "yellow",
        shape: "circle",
      },
      contrast_group: "go",
    },
    {
      id: "rabbit",
      label: "chú thỏ",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "thẻ đi tiếp",
        color: "blue",
        shape: "square",
      },
      contrast_group: "go",
    },
    {
      id: "star",
      label: "sao vàng",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "thẻ đi tiếp",
        color: "yellow",
        shape: "star",
      },
      contrast_group: "go",
    },
    {
      id: "red_light",
      label: "đèn đỏ",
      value: 5,
      ordering: 5,
      image: {
        kind: "emoji",
        ref: "🛑",
      },
      category: {
        type: "thẻ dừng lại",
        color: "red",
        shape: "circle",
      },
      contrast_group: "nogo",
    },
    {
      id: "moon",
      label: "mặt trăng",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      category: {
        type: "thẻ dừng lại",
        color: "blue",
        shape: "circle",
      },
      contrast_group: "nogo",
    },
    {
      id: "wolf",
      label: "chú sói",
      value: 7,
      ordering: 7,
      image: {
        kind: "emoji",
        ref: "🐺",
      },
      category: {
        type: "thẻ dừng lại",
        color: "red",
        shape: "square",
      },
      contrast_group: "nogo",
    },
    {
      id: "cloud",
      label: "đám mây",
      value: 8,
      ordering: 8,
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "thẻ dừng lại",
        color: "blue",
        shape: "triangle",
      },
      contrast_group: "nogo",
    },
  ],
  axes: {
    type: ["thẻ đi tiếp", "thẻ dừng lại"],
    color: ["red", "blue", "yellow", "green"],
    shape: ["circle", "square", "triangle", "star"],
  },
  relations: [
    {
      type: "contrast",
      source_id: "green_light",
      target_id: "red_light",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "sun",
      target_id: "moon",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "rabbit",
      target_id: "wolf",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "star",
      target_id: "cloud",
      metadata: { reason: "go_vs_nogo" },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chọn đúng màu được phép",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn đúng màu được phép",
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
    narration_template: "Chúng mình cùng chú ý chỉ chọn đúng màu được phép nhé",
  },
  ordering: [
    "green_light",
    "sun",
    "rabbit",
    "star",
    "red_light",
    "moon",
    "wolf",
    "cloud",
  ],
};

export const C6_INH_01_SEED: SkillSeed = {
  identity: C6_INH_01_IDENTITY,
  dataset: C6_INH_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C6-ATT-BOX-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-LOC-0008",
      template: "GT-022",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-LOC-0019",
      template: "GT-022",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-INH-NOGO-0030",
      template: "GT-026",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-INH-BOND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-INH-STIK-0001",
      template: "GT-025",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C6-INH-HUNT-0006",
      template: "GT-037",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
  ],
};
