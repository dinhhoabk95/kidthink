import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PLN_01_IDENTITY: SkillIdentity = {
  code: "C6.PLN.01",
  strand_code: "C6.PLN",
  competency_code: "C6",
  name: "Lập kế hoạch trước khi làm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan"],
  tier: "advanced",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C6.PLN.01-01",
      behaviour:
        "Nhận biết và thực hành Lập kế hoạch trước khi làm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PLN.01-02",
      behaviour:
        "Vận dụng Lập kế hoạch trước khi làm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PLN.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Lập kế hoạch trước khi làm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PLN_01_DATASET: SkillDataset = {
  skill_code: "C6.PLN.01",
  concept_label: "Lập kế hoạch trước khi làm",
  surface: "game",
  items: [
    {
      id: "notebook",
      label: "xếp quyển vở",
      image: {
        kind: "emoji",
        ref: "📓",
      },
      category: {
        type: "đồ học tập",
        color: "blue",
        shape: "square",
      },
      value: 1,
      ordering: 1,
      contrast_group: "study_step",
    },
    {
      id: "pencil",
      label: "cất bút chì",
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "đồ học tập",
        color: "yellow",
        shape: "triangle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "study_step",
    },
    {
      id: "ruler",
      label: "đặt thước kẻ",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "đồ học tập",
        color: "green",
        shape: "square",
      },
      value: 3,
      ordering: 3,
      contrast_group: "study_step",
    },
    {
      id: "backpack",
      label: "đóng cặp sách",
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "đồ học tập",
        color: "red",
        shape: "circle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "study_step",
    },
    {
      id: "shirt",
      label: "mặc áo gọn",
      image: {
        kind: "emoji",
        ref: "👕",
      },
      category: {
        type: "trang phục đẹp",
        color: "blue",
        shape: "square",
      },
      value: 5,
      ordering: 5,
      contrast_group: "dress_step",
    },
    {
      id: "shoes",
      label: "xỏ đôi giày",
      image: {
        kind: "emoji",
        ref: "👟",
      },
      category: {
        type: "trang phục đẹp",
        color: "blue",
        shape: "circle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "dress_step",
    },
    {
      id: "hat",
      label: "đội mũ xinh",
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      category: {
        type: "trang phục đẹp",
        color: "blue",
        shape: "circle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "dress_step",
    },
    {
      id: "bus",
      label: "ra xe trường",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "trang phục đẹp",
        color: "yellow",
        shape: "square",
      },
      value: 8,
      ordering: 8,
      contrast_group: "dress_step",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Lập kế hoạch trước khi làm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Lập kế hoạch trước khi làm",
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
      "Chúng mình cùng lập kế hoạch từng bước trước khi làm nhé",
  },
  axes: {
    type: ["đồ học tập", "trang phục đẹp"],
    step: {
      values: ["chuẩn bị", "bước 1", "bước 2", "hoàn thành"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "notebook",
      target_id: "pencil",
      type: "sequence",
    },
    {
      source_id: "pencil",
      target_id: "ruler",
      type: "sequence",
    },
    {
      source_id: "ruler",
      target_id: "backpack",
      type: "sequence",
    },
    {
      source_id: "backpack",
      target_id: "shirt",
      type: "sequence",
    },
  ],
  ordering: [
    "notebook",
    "pencil",
    "ruler",
    "backpack",
    "shirt",
    "shoes",
    "hat",
    "bus",
  ],
};

export const C6_PLN_01_SEED: SkillSeed = {
  identity: C6_PLN_01_IDENTITY,
  dataset: C6_PLN_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C6-PLN-MAZE-0021",
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-MAZE-0023",
      template: "GT-013",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
