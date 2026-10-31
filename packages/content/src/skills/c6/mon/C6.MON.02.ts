import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_MON_02_IDENTITY: SkillIdentity = {
  code: "C6.MON.02",
  strand_code: "C6.MON",
  competency_code: "C6",
  name: "Tự sửa lỗi",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["verify", "shift"],
  tier: "advanced",
  prerequisites: ["C6.MON.01"],
  learning_objectives: [
    {
      code: "LO-C6.MON.02-01",
      behaviour: "Nhận biết và thực hành Tự sửa lỗi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.MON.02-02",
      behaviour: "Vận dụng Tự sửa lỗi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.MON.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tự sửa lỗi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_MON_02_DATASET: SkillDataset = {
  skill_code: "C6.MON.02",
  concept_label: "Tự sửa lỗi",
  surface: "game",
  items: [
    {
      id: "cupcake",
      label: "bánh kem nhỏ",
      image: {
        kind: "emoji",
        ref: "🧁",
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
      id: "cookie",
      label: "bánh quy",
      image: {
        kind: "emoji",
        ref: "🍪",
      },
      category: {
        type: "bánh kẹo",
        color: "red",
        shape: "square",
      },
      value: 2,
      ordering: 2,
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
        color: "blue",
        shape: "triangle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "sweets",
    },
    {
      id: "candy",
      label: "viên kẹo",
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      category: {
        type: "bánh kẹo",
        color: "green",
        shape: "star",
      },
      value: 4,
      ordering: 4,
      contrast_group: "sweets",
    },
    {
      id: "trumpet",
      label: "cái kèn",
      image: {
        kind: "emoji",
        ref: "🎺",
      },
      category: {
        type: "đồ chơi",
        color: "yellow",
        shape: "triangle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "toys",
    },
    {
      id: "balloon",
      label: "bóng bay",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "đồ chơi",
        color: "red",
        shape: "circle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "toys",
    },
    {
      id: "yoyo",
      label: "con quay",
      image: {
        kind: "emoji",
        ref: "🪀",
      },
      category: {
        type: "đồ chơi",
        color: "green",
        shape: "square",
      },
      value: 7,
      ordering: 7,
      contrast_group: "toys",
    },
    {
      id: "kite",
      label: "cánh diều",
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      category: {
        type: "đồ chơi",
        color: "blue",
        shape: "star",
      },
      value: 8,
      ordering: 8,
      contrast_group: "toys",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tự sửa lỗi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự sửa lỗi",
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
    narration_template: "Chúng mình cùng thử lại và sửa cho đúng nhé",
  },
  axes: {
    type: ["bánh kẹo", "đồ chơi"],
    color: ["red", "blue", "yellow", "green"],
    shape: ["circle", "square", "triangle", "star"],
    stage: {
      values: ["phát hiện", "suy nghĩ", "thử sửa", "hoàn thành"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "cupcake",
      target_id: "cookie",
      type: "pair",
    },
    {
      source_id: "lollipop",
      target_id: "candy",
      type: "pair",
    },
    {
      source_id: "trumpet",
      target_id: "balloon",
      type: "pair",
    },
    {
      source_id: "yoyo",
      target_id: "kite",
      type: "pair",
    },
  ],
  ordering: [
    "cupcake",
    "cookie",
    "lollipop",
    "candy",
    "trumpet",
    "balloon",
    "yoyo",
    "kite",
  ],
};

export const C6_MON_02_SEED: SkillSeed = {
  identity: C6_MON_02_IDENTITY,
  dataset: C6_MON_02_DATASET,
  levels: [
    {
      code: "GL-C6-MON-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-SUB-0001",
      template: "GT-027",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-SUB-0002",
      template: "GT-027",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
  ],
};
