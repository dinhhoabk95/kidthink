import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SRT_05_IDENTITY: SkillIdentity = {
  code: "C3.SRT.05",
  strand_code: "C3.SRT",
  competency_code: "C3",
  name: "Sắp xếp theo trọng lượng",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sequence", "compare"],
  tier: "advanced",
  prerequisites: ["C1.MEAS.03"],
  learning_objectives: [
    {
      code: "LO-C3.SRT.05-01",
      behaviour: "Nhận biết và thực hành Sắp xếp theo trọng lượng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SRT.05-02",
      behaviour: "Vận dụng Sắp xếp theo trọng lượng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SRT.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Sắp xếp theo trọng lượng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SRT_05_DATASET: SkillDataset = {
  skill_code: "C3.SRT.05",
  concept_label: "Sắp xếp theo trọng lượng",
  surface: "game",
  items: [
    {
      id: "light_feather",
      label: "chiếc lông vũ nhẹ",
      image: {
        kind: "emoji",
        ref: "🪶",
      },
      category: {
        type: "đồ vật nhẹ",
      },
      contrast_group: "weight_light",
      value: 1,
      ordering: 1,
    },
    {
      id: "light_leaf",
      label: "chiếc lá cây nhẹ",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "đồ vật nhẹ",
      },
      contrast_group: "weight_light",
      value: 2,
      ordering: 2,
    },
    {
      id: "light_balloon",
      label: "quả bóng bay nhẹ",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "đồ vật nhẹ",
      },
      contrast_group: "weight_light",
      value: 3,
      ordering: 3,
    },
    {
      id: "medium_apple",
      label: "quả táo nặng vừa",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "đồ vật nhẹ",
      },
      contrast_group: "weight_light",
      value: 4,
      ordering: 4,
    },
    {
      id: "medium_book",
      label: "quyển sách nặng vừa",
      image: {
        kind: "emoji",
        ref: "📕",
      },
      category: {
        type: "đồ vật nặng",
      },
      contrast_group: "weight_heavy",
      value: 5,
      ordering: 5,
    },
    {
      id: "heavy_chair",
      label: "chiếc ghế gỗ nặng",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ vật nặng",
      },
      contrast_group: "weight_heavy",
      value: 6,
      ordering: 6,
    },
    {
      id: "heavy_rock",
      label: "hòn đá rất nặng",
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "đồ vật nặng",
      },
      contrast_group: "weight_heavy",
      value: 7,
      ordering: 7,
    },
    {
      id: "very_heavy_elephant",
      label: "con voi khổng lồ",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "đồ vật nặng",
      },
      contrast_group: "weight_heavy",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      source_id: "light_feather",
      target_id: "light_leaf",
      type: "sequence",
    },
    {
      source_id: "light_leaf",
      target_id: "light_balloon",
      type: "sequence",
    },
    {
      source_id: "light_balloon",
      target_id: "medium_apple",
      type: "sequence",
    },
    {
      source_id: "medium_apple",
      target_id: "medium_book",
      type: "sequence",
    },
    {
      source_id: "medium_book",
      target_id: "heavy_chair",
      type: "sequence",
    },
    {
      source_id: "heavy_chair",
      target_id: "heavy_rock",
      type: "sequence",
    },
    {
      source_id: "heavy_rock",
      target_id: "very_heavy_elephant",
      type: "sequence",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen hai vật có trọng lượng khác nhau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Sắp xếp ba vật theo thứ tự từ nhẹ đến nặng",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Sắp xếp bốn vật theo thứ tự trọng lượng",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Nhận biết vị trí thích hợp trong dãy trọng lượng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Hoàn thành dãy trọng lượng độc lập",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng xếp các vật từ nhẹ đến nặng nhé",
  },
  ordering: [
    "light_feather",
    "light_leaf",
    "light_balloon",
    "medium_apple",
    "medium_book",
    "heavy_chair",
    "heavy_rock",
    "very_heavy_elephant",
  ],
};

export const C3_SRT_05_SEED: SkillSeed = {
  identity: C3_SRT_05_IDENTITY,
  dataset: C3_SRT_05_DATASET,
  levels: [
    {
      code: "GL-C3-SRT-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      template: "GT-016",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
    },
    {
      template: "GT-016",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
    },
    {
      template: "GT-016",
      band: "5-6",
      difficulty: 3,
      theme: "food",
    },
  ],
};
