import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PER_01_IDENTITY: SkillIdentity = {
  code: "C6.PER.01",
  strand_code: "C6.PER",
  competency_code: "C6",
  name: "Làm hết nhiệm vụ",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["plan", "inhibit"],
  tier: "basic",
  prerequisites: ["C6.ATT.01"],
  learning_objectives: [
    {
      code: "LO-C6.PER.01-01",
      behaviour: "Nhận biết và thực hành Làm hết nhiệm vụ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PER.01-02",
      behaviour: "Vận dụng Làm hết nhiệm vụ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PER.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Làm hết nhiệm vụ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PER_01_DATASET: SkillDataset = {
  skill_code: "C6.PER.01",
  concept_label: "Làm hết nhiệm vụ",
  surface: "game",
  items: [
    {
      id: "cookie",
      label: "bánh quy",
      image: {
        kind: "emoji",
        ref: "🍪",
      },
      category: {
        type: "bánh kẹo",
        color: "yellow",
        shape: "circle",
      },
      value: 1,
      ordering: 1,
      contrast_group: "sweets",
    },
    {
      id: "lollipop",
      label: "kẹo mút",
      image: {
        kind: "emoji",
        ref: "🍭",
      },
      category: {
        type: "bánh kẹo",
        color: "red",
        shape: "circle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "sweets",
    },
    {
      id: "donut",
      label: "bánh vòng",
      image: {
        kind: "emoji",
        ref: "🍩",
      },
      category: {
        type: "bánh kẹo",
        color: "yellow",
        shape: "circle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "sweets",
    },
    {
      id: "cupcake",
      label: "bánh kem",
      image: {
        kind: "emoji",
        ref: "🧁",
      },
      category: {
        type: "bánh kẹo",
        color: "blue",
        shape: "circle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "sweets",
    },
    {
      id: "backpack",
      label: "cặp sách",
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "đồ học tập",
        color: "blue",
        shape: "square",
      },
      value: 5,
      ordering: 5,
      contrast_group: "study_tools",
    },
    {
      id: "brush",
      label: "cọ vẽ",
      image: {
        kind: "emoji",
        ref: "🖌️",
      },
      category: {
        type: "đồ học tập",
        color: "red",
        shape: "triangle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "study_tools",
    },
    {
      id: "set_square",
      label: "thước đo",
      image: {
        kind: "emoji",
        ref: "📐",
      },
      category: {
        type: "đồ học tập",
        color: "yellow",
        shape: "triangle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "study_tools",
    },
    {
      id: "palette",
      label: "bảng pha màu",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "đồ học tập",
        color: "blue",
        shape: "circle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "study_tools",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Làm hết nhiệm vụ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Làm hết nhiệm vụ",
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
    narration_template: "Chúng mình cùng kiên trì hoàn thành nhiệm vụ nhé",
  },
  axes: {
    type: ["bánh kẹo", "đồ học tập"],
    progress: {
      values: ["bắt đầu", "đang làm", "sắp xong", "hoàn thành"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "cookie",
      target_id: "lollipop",
      type: "pair",
    },
    {
      source_id: "donut",
      target_id: "cupcake",
      type: "pair",
    },
    {
      source_id: "backpack",
      target_id: "brush",
      type: "pair",
    },
    {
      source_id: "set_square",
      target_id: "palette",
      type: "pair",
    },
  ],
  ordering: [
    "cookie",
    "lollipop",
    "donut",
    "cupcake",
    "backpack",
    "brush",
    "set_square",
    "palette",
  ],
};

export const C6_PER_01_SEED: SkillSeed = {
  identity: C6_PER_01_IDENTITY,
  dataset: C6_PER_01_DATASET,
  levels: [
    {
      code: "GL-C6-PER-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
  ],
};
