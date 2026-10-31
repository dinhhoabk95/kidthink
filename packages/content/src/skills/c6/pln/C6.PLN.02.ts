import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PLN_02_IDENTITY: SkillIdentity = {
  code: "C6.PLN.02",
  strand_code: "C6.PLN",
  competency_code: "C6",
  name: "Chọn đường đi tối ưu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "compare"],
  tier: "advanced",
  prerequisites: ["C2.MAZ.02"],
  learning_objectives: [
    {
      code: "LO-C6.PLN.02-01",
      behaviour: "Nhận biết và thực hành Chọn đường đi tối ưu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PLN.02-02",
      behaviour: "Vận dụng Chọn đường đi tối ưu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PLN.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn đường đi tối ưu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PLN_02_DATASET: SkillDataset = {
  skill_code: "C6.PLN.02",
  concept_label: "Chọn đường đi ngắn nhất",
  surface: "game",
  items: [
    {
      id: "scooter",
      label: "xe trượt nhỏ",
      image: {
        kind: "emoji",
        ref: "🛴",
      },
      category: {
        type: "xe đi chậm",
        color: "red",
        shape: "triangle",
      },
      value: 1,
      ordering: 1,
      contrast_group: "slow_transport",
    },
    {
      id: "bicycle",
      label: "xe đạp xanh",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "xe đi chậm",
        color: "green",
        shape: "circle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "slow_transport",
    },
    {
      id: "motorbike",
      label: "xe máy nhỏ",
      image: {
        kind: "emoji",
        ref: "🛵",
      },
      category: {
        type: "xe đi chậm",
        color: "blue",
        shape: "circle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "slow_transport",
    },
    {
      id: "bus",
      label: "xe buýt vàng",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "xe đi chậm",
        color: "yellow",
        shape: "square",
      },
      value: 4,
      ordering: 4,
      contrast_group: "slow_transport",
    },
    {
      id: "car",
      label: "ô tô đỏ",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "xe đi nhanh",
        color: "red",
        shape: "circle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "fast_transport",
    },
    {
      id: "train",
      label: "tàu hỏa dài",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "xe đi nhanh",
        color: "green",
        shape: "square",
      },
      value: 6,
      ordering: 6,
      contrast_group: "fast_transport",
    },
    {
      id: "fast_train",
      label: "tàu siêu tốc",
      image: {
        kind: "emoji",
        ref: "🚄",
      },
      category: {
        type: "xe đi nhanh",
        color: "white",
        shape: "square",
      },
      value: 7,
      ordering: 7,
      contrast_group: "fast_transport",
    },
    {
      id: "airplane",
      label: "máy bay nhanh",
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "xe đi nhanh",
        color: "blue",
        shape: "triangle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "fast_transport",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chọn đường đi tối ưu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn đường đi tối ưu",
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
      "Chúng mình cùng quan sát và chọn đường đi ngắn nhất nhé",
  },
  axes: {
    efficiency: {
      values: ["rất nhanh", "nhanh", "chậm", "rất chậm"],
      ordered: true,
    },
    type: ["xe đi chậm", "xe đi nhanh"],
  },
  relations: [
    {
      source_id: "scooter",
      target_id: "bicycle",
      type: "sequence",
    },
    {
      source_id: "bicycle",
      target_id: "motorbike",
      type: "sequence",
    },
    {
      source_id: "motorbike",
      target_id: "bus",
      type: "sequence",
    },
    {
      source_id: "bus",
      target_id: "car",
      type: "sequence",
    },
  ],
  ordering: [
    "scooter",
    "bicycle",
    "motorbike",
    "bus",
    "car",
    "train",
    "fast_train",
    "airplane",
  ],
};

export const C6_PLN_02_SEED: SkillSeed = {
  identity: C6_PLN_02_IDENTITY,
  dataset: C6_PLN_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C6-PLN-SCH-0001",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SCH-0002",
      template: "GT-024",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      template: "GT-020",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
  ],
};
