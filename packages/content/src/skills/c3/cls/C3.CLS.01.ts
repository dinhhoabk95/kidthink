import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_CLS_01_IDENTITY: SkillIdentity = {
  code: "C3.CLS.01",
  strand_code: "C3.CLS",
  competency_code: "C3",
  name: "Phân loại theo màu",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["sort", "observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C3.CLS.01-01",
      behaviour: "Nhận biết và thực hành Phân loại theo màu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.CLS.01-02",
      behaviour: "Vận dụng Phân loại theo màu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.CLS.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Phân loại theo màu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_CLS_01_DATASET: SkillDataset = {
  skill_code: "C3.CLS.01",
  concept_label: "Phân loại theo màu",
  surface: "game",
  items: [
    {
      id: "red_apple",
      label: "quả táo đỏ",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "vật màu đỏ",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "red_group",
      value: 1,
      ordering: 1,
    },
    {
      id: "red_strawberry",
      label: "quả dâu đỏ",
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "vật màu đỏ",
        color: "red",
        shape: "circle",
        size: "small",
      },
      contrast_group: "red_group",
      value: 2,
      ordering: 2,
    },
    {
      id: "red_balloon",
      label: "bóng bay đỏ",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "vật màu đỏ",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "red_group",
      value: 3,
      ordering: 3,
    },
    {
      id: "red_car",
      label: "xe ô-tô đỏ",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "vật màu đỏ",
        color: "red",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "red_group",
      value: 4,
      ordering: 4,
    },
    {
      id: "yellow_banana",
      label: "quả chuối vàng",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "vật màu vàng",
        color: "yellow",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "yellow_group",
      value: 5,
      ordering: 5,
    },
    {
      id: "yellow_lemon",
      label: "quả chanh vàng",
      image: {
        kind: "emoji",
        ref: "🍋",
      },
      category: {
        type: "vật màu vàng",
        color: "yellow",
        shape: "circle",
        size: "small",
      },
      contrast_group: "yellow_group",
      value: 6,
      ordering: 6,
    },
    {
      id: "yellow_star",
      label: "ngôi sao vàng",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "vật màu vàng",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "yellow_group",
      value: 7,
      ordering: 7,
    },
    {
      id: "yellow_duck",
      label: "chú vịt vàng",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "vật màu vàng",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "yellow_group",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "red_apple",
      target_id: "yellow_banana",
      explanation: "táo màu đỏ khác chuối màu vàng",
    },
    {
      type: "contrast",
      source_id: "red_strawberry",
      target_id: "yellow_lemon",
      explanation: "dâu màu đỏ khác chanh màu vàng",
    },
    {
      type: "contrast",
      source_id: "red_balloon",
      target_id: "yellow_star",
      explanation: "bóng bay đỏ khác ngôi sao vàng",
    },
    {
      type: "contrast",
      source_id: "red_car",
      target_id: "yellow_duck",
      explanation: "xe ô-tô đỏ khác chú vịt vàng",
    },
  ],
  axes: {
    type: ["vật màu đỏ", "vật màu vàng"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với phân loại theo màu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng phân loại theo màu",
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
    narration_template: "Chúng mình cùng phân loại các đồ vật theo màu sắc nhé",
  },
  ordering: [
    "red_apple",
    "red_strawberry",
    "red_balloon",
    "red_car",
    "yellow_banana",
    "yellow_lemon",
    "yellow_star",
    "yellow_duck",
  ],
};

export const C3_CLS_01_SEED: SkillSeed = {
  identity: C3_CLS_01_IDENTITY,
  dataset: C3_CLS_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C3-CLS-CARD-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-SUB-FAST-0018",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-BOX-0019",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-FLIP-0031",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-DROP-0032",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-PAIR-0033",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
