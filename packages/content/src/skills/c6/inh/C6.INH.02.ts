import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INH_02_IDENTITY: SkillIdentity = {
  code: "C6.INH.02",
  strand_code: "C6.INH",
  competency_code: "C6",
  name: "Chỉ chọn một hình nhất định",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["inhibit"],
  tier: "basic",
  prerequisites: ["C3.CLS.02"],
  learning_objectives: [
    {
      code: "LO-C6.INH.02-01",
      behaviour:
        "Nhận biết và thực hành Chỉ chọn một hình nhất định ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INH.02-02",
      behaviour:
        "Vận dụng Chỉ chọn một hình nhất định trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INH.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chỉ chọn một hình nhất định",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INH_02_DATASET: SkillDataset = {
  skill_code: "C6.INH.02",
  concept_label: "Chỉ chọn một hình nhất định",
  surface: "game",
  items: [
    {
      id: "apple",
      label: "quả táo đỏ",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "quả màu đỏ",
        color: "red",
        shape: "circle",
      },
      contrast_group: "go",
    },
    {
      id: "strawberry",
      label: "quả dâu tây",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "quả màu đỏ",
        color: "red",
        shape: "triangle",
      },
      contrast_group: "go",
    },
    {
      id: "cherry",
      label: "quả anh đào",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "🍒",
      },
      category: {
        type: "quả màu đỏ",
        color: "red",
        shape: "circle",
      },
      contrast_group: "go",
    },
    {
      id: "watermelon",
      label: "dưa hấu đỏ",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "quả màu đỏ",
        color: "green",
        shape: "triangle",
      },
      contrast_group: "go",
    },
    {
      id: "lemon",
      label: "quả chanh vàng",
      value: 5,
      ordering: 5,
      image: {
        kind: "emoji",
        ref: "🍋",
      },
      category: {
        type: "quả màu khác",
        color: "yellow",
        shape: "circle",
      },
      contrast_group: "nogo",
    },
    {
      id: "banana",
      label: "quả chuối vàng",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "quả màu khác",
        color: "yellow",
        shape: "triangle",
      },
      contrast_group: "nogo",
    },
    {
      id: "grape",
      label: "chùm nho tím",
      value: 7,
      ordering: 7,
      image: {
        kind: "emoji",
        ref: "🍇",
      },
      category: {
        type: "quả màu khác",
        color: "purple",
        shape: "circle",
      },
      contrast_group: "nogo",
    },
    {
      id: "pineapple",
      label: "quả dứa vàng",
      value: 8,
      ordering: 8,
      image: {
        kind: "emoji",
        ref: "🍍",
      },
      category: {
        type: "quả màu khác",
        color: "yellow",
        shape: "square",
      },
      contrast_group: "nogo",
    },
  ],
  axes: {
    type: ["quả màu đỏ", "quả màu khác"],
    color: ["red", "blue", "yellow", "green", "purple"],
    shape: ["circle", "square", "triangle", "star"],
  },
  relations: [
    {
      type: "contrast",
      source_id: "apple",
      target_id: "lemon",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "strawberry",
      target_id: "banana",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "cherry",
      target_id: "grape",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "watermelon",
      target_id: "pineapple",
      metadata: { reason: "go_vs_nogo" },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chỉ chọn một hình nhất định",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chỉ chọn một hình nhất định",
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
    narration_template: "Chúng mình cùng chú ý chỉ chọn đúng hình nhé",
  },
  ordering: [
    "apple",
    "strawberry",
    "cherry",
    "watermelon",
    "lemon",
    "banana",
    "grape",
    "pineapple",
  ],
};

export const C6_INH_02_SEED: SkillSeed = {
  identity: C6_INH_02_IDENTITY,
  dataset: C6_INH_02_DATASET,
  levels: [
    {
      code: "GL-C3-SHP-BSK-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLS-0006",
      template: "GT-012",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLS-0007",
      template: "GT-012",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLS-0008",
      template: "GT-012",
      band: "5-6",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C6-INH-INTRO-6002",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      sequence_no: 61,
    },
    {
      code: "GL-C6-INH-TAP-6004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
      sequence_no: 63,
    },
    {
      code: "GL-C6-INH-MATCH-6006",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
      sequence_no: 65,
    },
    {
      code: "GL-C6-INH-FLIP-6008",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
      sequence_no: 67,
    },
    {
      code: "GL-C6-INH-SLOT-6010",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      sequence_no: 69,
    },
    {
      code: "GL-C6-INH-INTRO-6012",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      sequence_no: 71,
    },
    {
      code: "GL-C6-INH-MATCH-6014",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
      sequence_no: 73,
    },
    {
      code: "GL-C6-INH-TAP-6016",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
      sequence_no: 75,
    },
  ],
};
