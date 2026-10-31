import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INI_05_IDENTITY: SkillIdentity = {
  code: "C6.INI.05",
  strand_code: "C6.INI",
  competency_code: "C6",
  name: "Chọn công cụ phù hợp trước khi làm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "infer"],
  tier: "advanced",
  prerequisites: ["C6.INI.02", "C4.TOO.02"],
  learning_objectives: [
    {
      code: "LO-C6.INI.05-01",
      behaviour:
        "Nhận biết và thực hành Chọn công cụ phù hợp trước khi làm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INI.05-02",
      behaviour:
        "Vận dụng Chọn công cụ phù hợp trước khi làm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INI.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn công cụ phù hợp trước khi làm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INI_05_DATASET: SkillDataset = {
  skill_code: "C6.INI.05",
  concept_label: "Chọn công cụ phù hợp trước khi làm",
  surface: "game",
  items: [
    {
      id: "paper",
      label: "tờ giấy trắng",
      image: {
        kind: "emoji",
        ref: "📄",
      },
      category: {
        type: "dụng cụ vẽ",
        color: "white",
        shape: "square",
      },
      value: 1,
      ordering: 1,
      contrast_group: "art_tools",
    },
    {
      id: "pencil",
      label: "bút chì vẽ",
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "dụng cụ vẽ",
        color: "yellow",
        shape: "triangle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "art_tools",
    },
    {
      id: "palette",
      label: "bảng pha màu",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "dụng cụ vẽ",
        color: "blue",
        shape: "circle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "art_tools",
    },
    {
      id: "brush",
      label: "cọ tô màu",
      image: {
        kind: "emoji",
        ref: "🖌️",
      },
      category: {
        type: "dụng cụ vẽ",
        color: "red",
        shape: "triangle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "art_tools",
    },
    {
      id: "bowl",
      label: "cái bát tròn",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ ăn uống",
        color: "blue",
        shape: "circle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "dining_tools",
    },
    {
      id: "spoon",
      label: "chiếc thìa nhỏ",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ ăn uống",
        color: "white",
        shape: "triangle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "dining_tools",
    },
    {
      id: "cup",
      label: "cốc uống nước",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "đồ ăn uống",
        color: "white",
        shape: "circle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "dining_tools",
    },
    {
      id: "napkin",
      label: "khăn lau miệng",
      image: {
        kind: "emoji",
        ref: "🧻",
      },
      category: {
        type: "đồ ăn uống",
        color: "white",
        shape: "square",
      },
      value: 8,
      ordering: 8,
      contrast_group: "dining_tools",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chọn công cụ phù hợp trước khi làm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn công cụ phù hợp trước khi làm",
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
      "Chúng mình cùng chọn công cụ phù hợp trước khi làm nhé",
  },
  axes: {
    type: ["dụng cụ vẽ", "đồ ăn uống"],
    suitability: {
      values: ["rất hợp", "phù hợp", "tạm được", "chưa hợp"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "paper",
      target_id: "pencil",
      type: "pair",
    },
    {
      source_id: "palette",
      target_id: "brush",
      type: "pair",
    },
    {
      source_id: "bowl",
      target_id: "spoon",
      type: "pair",
    },
    {
      source_id: "cup",
      target_id: "napkin",
      type: "pair",
    },
  ],
  ordering: [
    "paper",
    "pencil",
    "palette",
    "brush",
    "bowl",
    "spoon",
    "cup",
    "napkin",
  ],
};

export const C6_INI_05_SEED: SkillSeed = {
  identity: C6_INI_05_IDENTITY,
  dataset: C6_INI_05_DATASET,
  levels: [
    {
      code: "GL-C6-INI-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
