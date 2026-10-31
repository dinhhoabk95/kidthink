import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INI_04_IDENTITY: SkillIdentity = {
  code: "C6.INI.04",
  strand_code: "C6.INI",
  competency_code: "C6",
  name: "Tự đặt mục tiêu nhỏ",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "create"],
  tier: "advanced",
  prerequisites: ["C6.INI.02"],
  learning_objectives: [
    {
      code: "LO-C6.INI.04-01",
      behaviour: "Nhận biết và thực hành Tự đặt mục tiêu nhỏ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INI.04-02",
      behaviour: "Vận dụng Tự đặt mục tiêu nhỏ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INI.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tự đặt mục tiêu nhỏ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INI_04_DATASET: SkillDataset = {
  skill_code: "C6.INI.04",
  concept_label: "Tự đặt mục tiêu nhỏ",
  surface: "game",
  items: [
    {
      id: "chair",
      label: "xếp cái ghế",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "dọn bàn ăn",
        color: "red",
        shape: "square",
      },
      value: 1,
      ordering: 1,
      contrast_group: "table_prep",
    },
    {
      id: "bowl",
      label: "đặt cái bát",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "dọn bàn ăn",
        color: "green",
        shape: "circle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "table_prep",
    },
    {
      id: "spoon",
      label: "đặt cái thìa",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "dọn bàn ăn",
        color: "blue",
        shape: "triangle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "table_prep",
    },
    {
      id: "cup",
      label: "rót cốc nước",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "dọn bàn ăn",
        color: "white",
        shape: "circle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "table_prep",
    },
    {
      id: "rice",
      label: "xới bát cơm",
      image: {
        kind: "emoji",
        ref: "🍚",
      },
      category: {
        type: "bày món ăn",
        color: "white",
        shape: "circle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "food_serve",
    },
    {
      id: "fish_dish",
      label: "bày đĩa cá",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "bày món ăn",
        color: "blue",
        shape: "triangle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "food_serve",
    },
    {
      id: "apple",
      label: "đặt quả ngọt",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "bày món ăn",
        color: "red",
        shape: "circle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "food_serve",
    },
    {
      id: "clock",
      label: "ăn đúng giờ",
      image: {
        kind: "emoji",
        ref: "🕰️",
      },
      category: {
        type: "bày món ăn",
        color: "yellow",
        shape: "square",
      },
      value: 8,
      ordering: 8,
      contrast_group: "food_serve",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tự đặt mục tiêu nhỏ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự đặt mục tiêu nhỏ",
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
    narration_template: "Chúng mình cùng đặt mục tiêu nhỏ để hoàn thành nhé",
  },
  axes: {
    type: ["dọn bàn ăn", "bày món ăn"],
    step: {
      values: ["bước 1", "bước 2", "bước 3", "bước 4"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "chair",
      target_id: "bowl",
      type: "sequence",
    },
    {
      source_id: "bowl",
      target_id: "spoon",
      type: "sequence",
    },
    {
      source_id: "spoon",
      target_id: "cup",
      type: "sequence",
    },
    {
      source_id: "cup",
      target_id: "rice",
      type: "sequence",
    },
  ],
  ordering: [
    "chair",
    "bowl",
    "spoon",
    "cup",
    "rice",
    "fish_dish",
    "apple",
    "clock",
  ],
};

export const C6_INI_04_SEED: SkillSeed = {
  identity: C6_INI_04_IDENTITY,
  dataset: C6_INI_04_DATASET,
  levels: [
    {
      code: "GL-C6-INI-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SHAD-0008",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
  ],
};
