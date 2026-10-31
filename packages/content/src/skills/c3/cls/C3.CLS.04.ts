import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_CLS_04_IDENTITY: SkillIdentity = {
  code: "C3.CLS.04",
  strand_code: "C3.CLS",
  competency_code: "C3",
  name: "Phân loại theo chức năng",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sort", "infer"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C3.CLS.04-01",
      behaviour: "Nhận biết và thực hành Phân loại theo chức năng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.CLS.04-02",
      behaviour: "Vận dụng Phân loại theo chức năng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.CLS.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân loại theo chức năng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_CLS_04_DATASET: SkillDataset = {
  skill_code: "C3.CLS.04",
  concept_label: "Phân loại theo chức năng",
  surface: "game",
  items: [
    {
      id: "study_pencil",
      label: "bút chì viết",
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "đồ học tập",
        color: "yellow",
        shape: "rectangle",
        size: "small",
      },
      contrast_group: "study_tools",
      value: 1,
      ordering: 1,
    },
    {
      id: "study_notebook",
      label: "quyển vở kẻ",
      image: {
        kind: "emoji",
        ref: "📓",
      },
      category: {
        type: "đồ học tập",
        color: "blue",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "study_tools",
      value: 2,
      ordering: 2,
    },
    {
      id: "study_ruler",
      label: "thước kẻ thẳng",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "đồ học tập",
        color: "yellow",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "study_tools",
      value: 3,
      ordering: 3,
    },
    {
      id: "study_backpack",
      label: "cặp sách đi",
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "đồ học tập",
        color: "red",
        shape: "square",
        size: "large",
      },
      contrast_group: "study_tools",
      value: 4,
      ordering: 4,
    },
    {
      id: "eat_bowl",
      label: "chiếc bát ăn",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ ăn uống",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "dining_tools",
      value: 5,
      ordering: 5,
    },
    {
      id: "eat_spoon",
      label: "chiếc thìa xúc",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ ăn uống",
        color: "yellow",
        shape: "triangle",
        size: "small",
      },
      contrast_group: "dining_tools",
      value: 6,
      ordering: 6,
    },
    {
      id: "eat_cup",
      label: "chiếc cốc uống",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "đồ ăn uống",
        color: "white",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "dining_tools",
      value: 7,
      ordering: 7,
    },
    {
      id: "eat_plate",
      label: "chiếc đĩa tròn",
      image: {
        kind: "emoji",
        ref: "🍽️",
      },
      category: {
        type: "đồ ăn uống",
        color: "white",
        shape: "circle",
        size: "large",
      },
      contrast_group: "dining_tools",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "study_pencil",
      target_id: "eat_bowl",
      explanation: "bút dùng để viết khác bát dùng ăn cơm",
    },
    {
      type: "contrast",
      source_id: "study_notebook",
      target_id: "eat_spoon",
      explanation: "vở dùng để viết khác thìa dùng xúc canh",
    },
    {
      type: "contrast",
      source_id: "study_ruler",
      target_id: "eat_cup",
      explanation: "thước dùng để kẻ khác cốc dùng uống nước",
    },
    {
      type: "contrast",
      source_id: "study_backpack",
      target_id: "eat_plate",
      explanation: "cặp sách đựng đồ khác đĩa đựng thức ăn",
    },
  ],
  axes: {
    type: ["đồ học tập", "đồ ăn uống"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với phân loại theo chức năng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng phân loại theo chức năng",
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
    narration_template: "Chúng mình cùng phân loại đồ vật theo công dụng nhé",
  },
  ordering: [
    "study_pencil",
    "study_notebook",
    "study_ruler",
    "study_backpack",
    "eat_bowl",
    "eat_spoon",
    "eat_cup",
    "eat_plate",
  ],
};

export const C3_CLS_04_SEED: SkillSeed = {
  identity: C3_CLS_04_IDENTITY,
  dataset: C3_CLS_04_DATASET,
  levels: [
    {
      code: "GL-C3-CLS-MULTI-0202",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-ODD-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
  ],
};
