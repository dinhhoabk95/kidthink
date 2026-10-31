import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_CLS_03_IDENTITY: SkillIdentity = {
  code: "C3.CLS.03",
  strand_code: "C3.CLS",
  competency_code: "C3",
  name: "Phân loại theo kích thước",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["sort", "compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.01"],
  learning_objectives: [
    {
      code: "LO-C3.CLS.03-01",
      behaviour:
        "Nhận biết và thực hành Phân loại theo kích thước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.CLS.03-02",
      behaviour:
        "Vận dụng Phân loại theo kích thước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.CLS.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân loại theo kích thước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_CLS_03_DATASET: SkillDataset = {
  skill_code: "C3.CLS.03",
  concept_label: "Phân loại theo kích thước",
  surface: "game",
  items: [
    {
      id: "small_ant",
      label: "chú kiến nhỏ",
      image: {
        kind: "emoji",
        ref: "🐜",
      },
      category: {
        type: "vật nhỏ bé",
        color: "black",
        shape: "circle",
        size: "small",
      },
      contrast_group: "small_group",
      value: 1,
      ordering: 1,
    },
    {
      id: "small_bee",
      label: "chú ong nhỏ",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "vật nhỏ bé",
        color: "yellow",
        shape: "circle",
        size: "small",
      },
      contrast_group: "small_group",
      value: 2,
      ordering: 2,
    },
    {
      id: "small_snail",
      label: "ốc sên nhỏ",
      image: {
        kind: "emoji",
        ref: "🐌",
      },
      category: {
        type: "vật nhỏ bé",
        color: "yellow",
        shape: "circle",
        size: "small",
      },
      contrast_group: "small_group",
      value: 3,
      ordering: 3,
    },
    {
      id: "small_bean",
      label: "hạt đậu nhỏ",
      image: {
        kind: "emoji",
        ref: "🫘",
      },
      category: {
        type: "vật nhỏ bé",
        color: "red",
        shape: "circle",
        size: "small",
      },
      contrast_group: "small_group",
      value: 4,
      ordering: 4,
    },
    {
      id: "big_bear",
      label: "chú gấu to",
      image: {
        kind: "emoji",
        ref: "🐻",
      },
      category: {
        type: "vật to lớn",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "large_group",
      value: 5,
      ordering: 5,
    },
    {
      id: "big_bus",
      label: "xe buýt lớn",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "vật to lớn",
        color: "yellow",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "large_group",
      value: 6,
      ordering: 6,
    },
    {
      id: "big_elephant",
      label: "chú voi to",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "vật to lớn",
        color: "blue",
        shape: "circle",
        size: "large",
      },
      contrast_group: "large_group",
      value: 7,
      ordering: 7,
    },
    {
      id: "big_whale",
      label: "cá voi khổng lồ",
      image: {
        kind: "emoji",
        ref: "🐳",
      },
      category: {
        type: "vật to lớn",
        color: "blue",
        shape: "circle",
        size: "large",
      },
      contrast_group: "large_group",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "small_ant",
      target_id: "big_bear",
      explanation: "kiến nhỏ khác gấu to",
    },
    {
      type: "contrast",
      source_id: "small_bee",
      target_id: "big_bus",
      explanation: "ong nhỏ khác xe buýt to",
    },
    {
      type: "contrast",
      source_id: "small_snail",
      target_id: "big_elephant",
      explanation: "ốc sên nhỏ khác voi to",
    },
    {
      type: "contrast",
      source_id: "small_bean",
      target_id: "big_whale",
      explanation: "hạt đậu nhỏ khác cá voi to",
    },
  ],
  axes: {
    type: ["vật nhỏ bé", "vật to lớn"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với phân loại theo kích thước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng phân loại theo kích thước",
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
    narration_template: "Chúng mình cùng phân loại các vật theo kích thước nhé",
  },
  ordering: [
    "small_ant",
    "small_bee",
    "small_snail",
    "small_bean",
    "big_bear",
    "big_bus",
    "big_elephant",
    "big_whale",
  ],
};

export const C3_CLS_03_SEED: SkillSeed = {
  identity: C3_CLS_03_IDENTITY,
  dataset: C3_CLS_03_DATASET,
  levels: [
    {
      code: "GL-C3-SIZ-BSK-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-SIZ-BSK-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
