import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_MON_01_IDENTITY: SkillIdentity = {
  code: "C6.MON.01",
  strand_code: "C6.MON",
  competency_code: "C6",
  name: "Tự phát hiện lỗi",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["verify"],
  tier: "advanced",
  prerequisites: ["C1.CNT.10"],
  learning_objectives: [
    {
      code: "LO-C6.MON.01-01",
      behaviour: "Nhận biết và thực hành Tự phát hiện lỗi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.MON.01-02",
      behaviour: "Vận dụng Tự phát hiện lỗi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.MON.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tự phát hiện lỗi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_MON_01_DATASET: SkillDataset = {
  skill_code: "C6.MON.01",
  concept_label: "Tự phát hiện lỗi",
  surface: "game",
  items: [
    {
      id: "guitar",
      label: "cây đàn",
      image: {
        kind: "emoji",
        ref: "🎸",
      },
      category: {
        type: "nhạc cụ",
        color: "red",
        shape: "triangle",
      },
      value: 1,
      ordering: 1,
      contrast_group: "instruments",
    },
    {
      id: "violin",
      label: "đàn vĩ cầm",
      image: {
        kind: "emoji",
        ref: "🎻",
      },
      category: {
        type: "nhạc cụ",
        color: "yellow",
        shape: "triangle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "instruments",
    },
    {
      id: "drum",
      label: "cái trống",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "nhạc cụ",
        color: "blue",
        shape: "circle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "instruments",
    },
    {
      id: "trumpet",
      label: "kèn đồng",
      image: {
        kind: "emoji",
        ref: "🎺",
      },
      category: {
        type: "nhạc cụ",
        color: "yellow",
        shape: "triangle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "instruments",
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
      value: 5,
      ordering: 5,
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
      value: 6,
      ordering: 6,
      contrast_group: "sweets",
    },
    {
      id: "croissant",
      label: "bánh sừng",
      image: {
        kind: "emoji",
        ref: "🥐",
      },
      category: {
        type: "bánh kẹo",
        color: "yellow",
        shape: "triangle",
      },
      value: 7,
      ordering: 7,
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
        shape: "circle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "sweets",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tự phát hiện lỗi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự phát hiện lỗi",
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
      "Chúng mình cùng quan sát và phát hiện điểm chưa đúng nhé",
  },
  axes: {
    type: ["nhạc cụ", "bánh kẹo"],
    status: {
      values: ["chính xác", "có lỗi nhỏ", "cần sửa", "làm lại"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "guitar",
      target_id: "violin",
      type: "pair",
    },
    {
      source_id: "drum",
      target_id: "trumpet",
      type: "pair",
    },
    {
      source_id: "cupcake",
      target_id: "donut",
      type: "pair",
    },
    {
      source_id: "croissant",
      target_id: "cookie",
      type: "pair",
    },
  ],
  ordering: [
    "guitar",
    "violin",
    "drum",
    "trumpet",
    "cupcake",
    "donut",
    "croissant",
    "cookie",
  ],
};

export const C6_MON_01_SEED: SkillSeed = {
  identity: C6_MON_01_IDENTITY,
  dataset: C6_MON_01_DATASET,
  levels: [
    {
      code: "GL-C6-MON-MEAS-0001",
      template: "GT-028",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-MEAS-0002",
      template: "GT-028",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C6-MON-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
