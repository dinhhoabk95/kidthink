import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SET_01_IDENTITY: SkillIdentity = {
  code: "C3.SET.01",
  strand_code: "C3.SET",
  competency_code: "C3",
  name: "Thuộc nhóm và khác nhóm",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["sort", "deduce"],
  tier: "basic",
  prerequisites: ["C3.CLS.01"],
  learning_objectives: [
    {
      code: "LO-C3.SET.01-01",
      behaviour: "Nhận biết và thực hành Thuộc / không thuộc nhóm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SET.01-02",
      behaviour: "Vận dụng Thuộc / không thuộc nhóm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SET.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thuộc / không thuộc nhóm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SET_01_DATASET: SkillDataset = {
  skill_code: "C3.SET.01",
  concept_label: "Thuộc nhóm và khác nhóm",
  surface: "game",
  items: [
    {
      id: "pencil",
      label: "chiếc bút chì",
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
      id: "notebook",
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
      id: "ruler",
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
      id: "scissors",
      label: "cái kéo cắt",
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "đồ học tập",
        color: "blue",
        shape: "triangle",
        size: "small",
      },
      contrast_group: "study_tools",
      value: 4,
      ordering: 4,
    },
    {
      id: "lion",
      label: "chú sư tử",
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "thú rừng vui",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "wild_animals",
      value: 5,
      ordering: 5,
    },
    {
      id: "tiger",
      label: "chú hổ vằn",
      image: {
        kind: "emoji",
        ref: "🐯",
      },
      category: {
        type: "thú rừng vui",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "wild_animals",
      value: 6,
      ordering: 6,
    },
    {
      id: "bear",
      label: "chú gấu nâu",
      image: {
        kind: "emoji",
        ref: "🐻",
      },
      category: {
        type: "thú rừng vui",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "wild_animals",
      value: 7,
      ordering: 7,
    },
    {
      id: "elephant",
      label: "chú voi to",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "thú rừng vui",
        color: "blue",
        shape: "circle",
        size: "large",
      },
      contrast_group: "wild_animals",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "pencil",
      target_id: "lion",
      explanation: "bút là đồ dùng học tập khác sư tử là động vật",
    },
    {
      type: "contrast",
      source_id: "notebook",
      target_id: "tiger",
      explanation: "vở là đồ dùng học tập khác hổ vằn là động vật",
    },
    {
      type: "contrast",
      source_id: "ruler",
      target_id: "bear",
      explanation: "thước là đồ dùng học tập khác gấu nâu là động vật",
    },
    {
      type: "contrast",
      source_id: "scissors",
      target_id: "elephant",
      explanation: "kéo là đồ dùng học tập khác voi to là động vật",
    },
  ],
  axes: {
    type: ["đồ học tập", "thú rừng vui"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với thuộc nhóm và khác nhóm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng thuộc nhóm và khác nhóm",
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
    narration_template: "Chúng mình cùng tìm các vật thuộc cùng một nhóm nhé",
  },
  ordering: [
    "pencil",
    "notebook",
    "ruler",
    "scissors",
    "lion",
    "tiger",
    "bear",
    "elephant",
  ],
};

export const C3_SET_01_SEED: SkillSeed = {
  identity: C3_SET_01_IDENTITY,
  dataset: C3_SET_01_DATASET,
  levels: [
    {
      code: "GL-C3-SET-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
  ],
};
