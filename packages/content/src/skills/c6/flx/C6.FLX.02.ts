import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_FLX_02_IDENTITY: SkillIdentity = {
  code: "C6.FLX.02",
  strand_code: "C6.FLX",
  competency_code: "C6",
  name: "Đổi tiêu chí phân loại",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["shift", "sort"],
  tier: "advanced",
  prerequisites: ["C3.CLS.01", "C3.CLS.02"],
  learning_objectives: [
    {
      code: "LO-C6.FLX.02-01",
      behaviour: "Nhận biết và thực hành Đổi tiêu chí phân loại ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.FLX.02-02",
      behaviour: "Vận dụng Đổi tiêu chí phân loại trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.FLX.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đổi tiêu chí phân loại",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_FLX_02_DATASET: SkillDataset = {
  skill_code: "C6.FLX.02",
  concept_label: "Đổi tiêu chí phân loại",
  surface: "game",
  items: [
    {
      id: "red_balloon",
      label: "bóng bay đỏ",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "đồ chơi",
        color: "red",
        shape: "circle",
      },
      contrast_group: "toys",
    },
    {
      id: "blue_kite",
      label: "cánh diều xanh",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      category: {
        type: "đồ chơi",
        color: "blue",
        shape: "square",
      },
      contrast_group: "toys",
    },
    {
      id: "yellow_teddy",
      label: "gấu bông vàng",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "đồ chơi",
        color: "yellow",
        shape: "triangle",
      },
      contrast_group: "toys",
    },
    {
      id: "green_yoyo",
      label: "con quay xanh",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "🪀",
      },
      category: {
        type: "đồ chơi",
        color: "green",
        shape: "star",
      },
      contrast_group: "toys",
    },
    {
      id: "red_backpack",
      label: "ba lô đỏ",
      value: 5,
      ordering: 5,
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "đồ học tập",
        color: "red",
        shape: "circle",
      },
      contrast_group: "study_tools",
    },
    {
      id: "blue_book",
      label: "sách xanh",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "📘",
      },
      category: {
        type: "đồ học tập",
        color: "blue",
        shape: "square",
      },
      contrast_group: "study_tools",
    },
    {
      id: "yellow_pencil",
      label: "bút chì vàng",
      value: 7,
      ordering: 7,
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "đồ học tập",
        color: "yellow",
        shape: "triangle",
      },
      contrast_group: "study_tools",
    },
    {
      id: "green_notebook",
      label: "vở kẻ xanh",
      value: 8,
      ordering: 8,
      image: {
        kind: "emoji",
        ref: "📗",
      },
      category: {
        type: "đồ học tập",
        color: "green",
        shape: "star",
      },
      contrast_group: "study_tools",
    },
  ],
  axes: {
    type: ["đồ chơi", "đồ học tập"],
    color: ["red", "blue", "yellow", "green"],
    shape: ["circle", "square", "triangle", "star"],
  },
  relations: [
    {
      type: "pair",
      source_id: "red_balloon",
      target_id: "red_backpack",
      metadata: { dimension: "color" },
    },
    {
      type: "pair",
      source_id: "blue_kite",
      target_id: "blue_book",
      metadata: { dimension: "color" },
    },
    {
      type: "pair",
      source_id: "yellow_teddy",
      target_id: "yellow_pencil",
      metadata: { dimension: "color" },
    },
    {
      type: "pair",
      source_id: "green_yoyo",
      target_id: "green_notebook",
      metadata: { dimension: "color" },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đổi tiêu chí phân loại",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đổi tiêu chí phân loại",
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
    narration_template: "Chúng mình cùng linh hoạt đổi cách phân loại nhé",
  },
  ordering: [
    "red_balloon",
    "blue_kite",
    "yellow_teddy",
    "green_yoyo",
    "red_backpack",
    "blue_book",
    "yellow_pencil",
    "green_notebook",
  ],
};

export const C6_FLX_02_SEED: SkillSeed = {
  identity: C6_FLX_02_IDENTITY,
  dataset: C6_FLX_02_DATASET,
  levels: [
    {
      code: "GL-C3-COL-BSK-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-COL-BSK-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
  ],
};
