import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_03_IDENTITY: SkillIdentity = {
  code: "C3.ALG.03",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Làm lặp lại theo mẫu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "infer"],
  tier: "advanced",
  prerequisites: ["C3.ALG.02", "C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.03-01",
      behaviour: "Nhận biết và thực hành Lặp lại một khối lệnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.03-02",
      behaviour: "Vận dụng Lặp lại một khối lệnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Lặp lại một khối lệnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_03_DATASET: SkillDataset = {
  skill_code: "C3.ALG.03",
  concept_label: "Làm lặp lại theo mẫu",
  surface: "game",
  items: [
    {
      id: "drum",
      label: "cái trống nhỏ",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "nhạc cụ vui",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "rhythm_a",
      value: 1,
      ordering: 1,
    },
    {
      id: "bell",
      label: "chuông ngân vang",
      image: {
        kind: "emoji",
        ref: "🔔",
      },
      category: {
        type: "nhạc cụ vui",
        color: "yellow",
        shape: "triangle",
        size: "small",
      },
      contrast_group: "rhythm_a",
      value: 2,
      ordering: 2,
    },
    {
      id: "trumpet",
      label: "cái kèn đồng",
      image: {
        kind: "emoji",
        ref: "🎺",
      },
      category: {
        type: "nhạc cụ vui",
        color: "yellow",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "rhythm_a",
      value: 3,
      ordering: 3,
    },
    {
      id: "guitar",
      label: "đàn ghi-ta",
      image: {
        kind: "emoji",
        ref: "🎸",
      },
      category: {
        type: "nhạc cụ vui",
        color: "red",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "rhythm_a",
      value: 4,
      ordering: 4,
    },
    {
      id: "ball",
      label: "quả bóng tròn",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "đồ chơi vui",
        color: "black",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "rhythm_b",
      value: 5,
      ordering: 5,
    },
    {
      id: "kite",
      label: "cánh diều bay",
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      category: {
        type: "đồ chơi vui",
        color: "red",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "rhythm_b",
      value: 6,
      ordering: 6,
    },
    {
      id: "balloon",
      label: "bóng bay đỏ",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "đồ chơi vui",
        color: "red",
        shape: "circle",
        size: "small",
      },
      contrast_group: "rhythm_b",
      value: 7,
      ordering: 7,
    },
    {
      id: "yoyo",
      label: "con quay nhỏ",
      image: {
        kind: "emoji",
        ref: "🪀",
      },
      category: {
        type: "đồ chơi vui",
        color: "green",
        shape: "circle",
        size: "small",
      },
      contrast_group: "rhythm_b",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "drum",
      target_id: "ball",
      explanation: "trống gõ nhịp cùng bóng nảy",
    },
    {
      type: "pair",
      source_id: "bell",
      target_id: "kite",
      explanation: "chuông ngân vang cùng diều bay",
    },
    {
      type: "pair",
      source_id: "trumpet",
      target_id: "balloon",
      explanation: "kèn thổi vang cùng bóng bay",
    },
    {
      type: "pair",
      source_id: "guitar",
      target_id: "yoyo",
      explanation: "đàn ghi-ta cùng con quay",
    },
  ],
  axes: {
    type: ["nhạc cụ vui", "đồ chơi vui"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với làm lặp lại theo mẫu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng làm lặp lại theo mẫu",
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
    narration_template: "Chúng mình cùng làm lặp lại nhịp nhàng theo mẫu nhé",
  },
  ordering: [
    "drum",
    "ball",
    "bell",
    "kite",
    "trumpet",
    "balloon",
    "guitar",
    "yoyo",
  ],
};

export const C3_ALG_03_SEED: SkillSeed = {
  identity: C3_ALG_03_IDENTITY,
  dataset: C3_ALG_03_DATASET,
  levels: [
    {
      code: "GL-C3-ALG-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
