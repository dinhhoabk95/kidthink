import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ANA_01_IDENTITY: SkillIdentity = {
  code: "C3.ANA.01",
  strand_code: "C3.ANA",
  competency_code: "C3",
  name: "Tìm cặp giống nhau",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match", "compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C3.ANA.01-01",
      behaviour: "Nhận biết và thực hành Tìm cặp giống nhau ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ANA.01-02",
      behaviour: "Vận dụng Tìm cặp giống nhau trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ANA.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tìm cặp giống nhau",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ANA_01_DATASET: SkillDataset = {
  skill_code: "C3.ANA.01",
  concept_label: "Tìm cặp giống nhau",
  surface: "game",
  items: [
    {
      id: "cup",
      label: "cái cốc nhỏ",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "đồ gia đình",
        color: "white",
        shape: "circle",
        size: "small",
      },
      contrast_group: "home_items",
      value: 1,
      ordering: 1,
    },
    {
      id: "bowl",
      label: "chiếc bát ăn",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ gia đình",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "home_items",
      value: 2,
      ordering: 2,
    },
    {
      id: "basket",
      label: "giỏ đựng đồ",
      image: {
        kind: "emoji",
        ref: "🧺",
      },
      category: {
        type: "đồ gia đình",
        color: "yellow",
        shape: "square",
        size: "large",
      },
      contrast_group: "home_items",
      value: 3,
      ordering: 3,
    },
    {
      id: "sofa",
      label: "ghế sô-pha",
      image: {
        kind: "emoji",
        ref: "🛋️",
      },
      category: {
        type: "đồ gia đình",
        color: "red",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "home_items",
      value: 4,
      ordering: 4,
    },
    {
      id: "apple",
      label: "quả táo đỏ",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả ngọt",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "sweet_fruits",
      value: 5,
      ordering: 5,
    },
    {
      id: "pear",
      label: "quả lê xanh",
      image: {
        kind: "emoji",
        ref: "🍐",
      },
      category: {
        type: "hoa quả ngọt",
        color: "green",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "sweet_fruits",
      value: 6,
      ordering: 6,
    },
    {
      id: "watermelon",
      label: "quả dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả ngọt",
        color: "green",
        shape: "circle",
        size: "large",
      },
      contrast_group: "sweet_fruits",
      value: 7,
      ordering: 7,
    },
    {
      id: "pineapple",
      label: "quả dứa chín",
      image: {
        kind: "emoji",
        ref: "🍍",
      },
      category: {
        type: "hoa quả ngọt",
        color: "yellow",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "sweet_fruits",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "cup",
      target_id: "bowl",
      explanation: "cốc uống nước và bát ăn cơm",
    },
    {
      type: "pair",
      source_id: "basket",
      target_id: "sofa",
      explanation: "giỏ đựng đồ và ghế ngồi",
    },
    {
      type: "pair",
      source_id: "apple",
      target_id: "pear",
      explanation: "quả táo và quả lê ngọt lành",
    },
    {
      type: "pair",
      source_id: "watermelon",
      target_id: "pineapple",
      explanation: "dưa hấu mát và dứa thơm ngon",
    },
  ],
  axes: {
    type: ["đồ gia đình", "hoa quả ngọt"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tìm cặp giống nhau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tìm cặp giống nhau",
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
    narration_template: "Chúng mình cùng tìm các cặp đồ vật giống nhau nhé",
  },
  ordering: [
    "cup",
    "bowl",
    "basket",
    "sofa",
    "apple",
    "pear",
    "watermelon",
    "pineapple",
  ],
};

export const C3_ANA_01_SEED: SkillSeed = {
  identity: C3_ANA_01_IDENTITY,
  dataset: C3_ANA_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C3-ANA-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-ANA-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-ANA-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-ANA-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-ANA-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      template: "GT-016",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
    },
    {
      template: "GT-016",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
    },
  ],
};
