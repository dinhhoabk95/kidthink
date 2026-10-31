import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_CLS_06_IDENTITY: SkillIdentity = {
  code: "C3.CLS.06",
  strand_code: "C3.CLS",
  competency_code: "C3",
  name: "Phân loại theo hai dấu hiệu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sort", "infer"],
  tier: "advanced",
  prerequisites: ["C3.CLS.01", "C3.CLS.02"],
  learning_objectives: [
    {
      code: "LO-C3.CLS.06-01",
      behaviour:
        "Nhận biết và thực hành Phân loại theo quy luật (đa thuộc tính) ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.CLS.06-02",
      behaviour:
        "Vận dụng Phân loại theo quy luật (đa thuộc tính) trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.CLS.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân loại theo quy luật (đa thuộc tính)",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_CLS_06_DATASET: SkillDataset = {
  skill_code: "C3.CLS.06",
  concept_label: "Phân loại theo hai dấu hiệu",
  surface: "game",
  items: [
    {
      id: "apple",
      label: "quả táo đỏ",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "vật đỏ tròn",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "red_circle",
      value: 1,
      ordering: 1,
    },
    {
      id: "balloon",
      label: "bóng bay đỏ",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "vật đỏ tròn",
        color: "red",
        shape: "circle",
        size: "small",
      },
      contrast_group: "red_circle",
      value: 2,
      ordering: 2,
    },
    {
      id: "strawberry",
      label: "quả dâu đỏ",
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "vật đỏ tròn",
        color: "red",
        shape: "circle",
        size: "small",
      },
      contrast_group: "red_circle",
      value: 3,
      ordering: 3,
    },
    {
      id: "tomato",
      label: "cà chua đỏ",
      image: {
        kind: "emoji",
        ref: "🍅",
      },
      category: {
        type: "vật đỏ tròn",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "red_circle",
      value: 4,
      ordering: 4,
    },
    {
      id: "book",
      label: "sách bìa xanh",
      image: {
        kind: "emoji",
        ref: "📘",
      },
      category: {
        type: "vật xanh vuông",
        color: "blue",
        shape: "square",
        size: "medium",
      },
      contrast_group: "blue_square",
      value: 5,
      ordering: 5,
    },
    {
      id: "present",
      label: "hộp quà xanh",
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "vật xanh vuông",
        color: "blue",
        shape: "square",
        size: "medium",
      },
      contrast_group: "blue_square",
      value: 6,
      ordering: 6,
    },
    {
      id: "block",
      label: "khối băng xanh",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "vật xanh vuông",
        color: "blue",
        shape: "square",
        size: "small",
      },
      contrast_group: "blue_square",
      value: 7,
      ordering: 7,
    },
    {
      id: "frame",
      label: "khung ảnh xanh",
      image: {
        kind: "emoji",
        ref: "🖼️",
      },
      category: {
        type: "vật xanh vuông",
        color: "blue",
        shape: "square",
        size: "large",
      },
      contrast_group: "blue_square",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "apple",
      target_id: "book",
      explanation: "táo đỏ tròn khác sách xanh vuông",
    },
    {
      type: "contrast",
      source_id: "balloon",
      target_id: "present",
      explanation: "bóng bay đỏ tròn khác hộp quà xanh vuông",
    },
    {
      type: "contrast",
      source_id: "strawberry",
      target_id: "block",
      explanation: "dâu đỏ tròn khác khối băng xanh vuông",
    },
    {
      type: "contrast",
      source_id: "tomato",
      target_id: "frame",
      explanation: "cà chua đỏ tròn khác khung ảnh xanh vuông",
    },
  ],
  axes: {
    type: ["vật đỏ tròn", "vật xanh vuông"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với phân loại theo hai dấu hiệu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng phân loại theo hai dấu hiệu",
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
      "Chúng mình cùng phân loại đồ vật theo cả màu sắc và hình dạng nhé",
  },
  ordering: [
    "apple",
    "balloon",
    "strawberry",
    "tomato",
    "book",
    "present",
    "block",
    "frame",
  ],
};

export const C3_CLS_06_SEED: SkillSeed = {
  identity: C3_CLS_06_IDENTITY,
  dataset: C3_CLS_06_DATASET,
  levels: [
    {
      code: "GL-C3-BLG-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-BLG-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-MUL-BSK-0001",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-MUL-BSK-0002",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-WEAVE-0001",
      template: "GT-033",
      band: "5-6",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-CONT-0001",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
  ],
};
