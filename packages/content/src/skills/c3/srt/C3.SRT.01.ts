import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SRT_01_IDENTITY: SkillIdentity = {
  code: "C3.SRT.01",
  strand_code: "C3.SRT",
  competency_code: "C3",
  name: "Sắp xếp tăng dần",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["sequence", "compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.01"],
  learning_objectives: [
    {
      code: "LO-C3.SRT.01-01",
      behaviour: "Nhận biết và thực hành Sắp xếp tăng dần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SRT.01-02",
      behaviour: "Vận dụng Sắp xếp tăng dần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SRT.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Sắp xếp tăng dần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SRT_01_DATASET: SkillDataset = {
  skill_code: "C3.SRT.01",
  concept_label: "Sắp xếp tăng dần",
  surface: "game",
  items: [
    {
      id: "small_bean",
      label: "hạt đậu nhỏ",
      image: {
        kind: "emoji",
        ref: "🫘",
      },
      category: {
        type: "đồ vật nhỏ",
      },
      contrast_group: "small_items",
      value: 1,
      ordering: 1,
    },
    {
      id: "small_strawberry",
      label: "quả dâu nhỏ",
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "đồ vật nhỏ",
      },
      contrast_group: "small_items",
      value: 2,
      ordering: 2,
    },
    {
      id: "medium_mushroom",
      label: "cây nấm vừa",
      image: {
        kind: "emoji",
        ref: "🍄",
      },
      category: {
        type: "đồ vật nhỏ",
      },
      contrast_group: "small_items",
      value: 3,
      ordering: 3,
    },
    {
      id: "medium_apple",
      label: "quả táo vừa",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "đồ vật nhỏ",
      },
      contrast_group: "small_items",
      value: 4,
      ordering: 4,
    },
    {
      id: "large_orange",
      label: "quả cam to",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "đồ vật lớn",
      },
      contrast_group: "large_items",
      value: 5,
      ordering: 5,
    },
    {
      id: "large_carrot",
      label: "củ cà rốt to",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "đồ vật lớn",
      },
      contrast_group: "large_items",
      value: 6,
      ordering: 6,
    },
    {
      id: "huge_corn",
      label: "bắp ngô rất to",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "đồ vật lớn",
      },
      contrast_group: "large_items",
      value: 7,
      ordering: 7,
    },
    {
      id: "huge_watermelon",
      label: "quả dưa khổng lồ",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "đồ vật lớn",
      },
      contrast_group: "large_items",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      source_id: "small_bean",
      target_id: "small_strawberry",
      type: "sequence",
    },
    {
      source_id: "small_strawberry",
      target_id: "medium_mushroom",
      type: "sequence",
    },
    {
      source_id: "medium_mushroom",
      target_id: "medium_apple",
      type: "sequence",
    },
    {
      source_id: "medium_apple",
      target_id: "large_orange",
      type: "sequence",
    },
    {
      source_id: "large_orange",
      target_id: "large_carrot",
      type: "sequence",
    },
    {
      source_id: "large_carrot",
      target_id: "huge_corn",
      type: "sequence",
    },
    {
      source_id: "huge_corn",
      target_id: "huge_watermelon",
      type: "sequence",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen dãy hai vật kích thước khác nhau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Sắp xếp ba vật theo thứ tự tăng dần",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Sắp xếp bốn vật từ nhỏ đến lớn",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Nhận biết vị trí thích hợp trong dãy tăng dần",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Hoàn thành dãy kích thước tăng dần độc lập",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng xếp các vật từ nhỏ đến lớn nhé",
  },
  ordering: [
    "small_bean",
    "small_strawberry",
    "medium_mushroom",
    "medium_apple",
    "large_orange",
    "large_carrot",
    "huge_corn",
    "huge_watermelon",
  ],
};

export const C3_SRT_01_SEED: SkillSeed = {
  identity: C3_SRT_01_IDENTITY,
  dataset: C3_SRT_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C3-SRT-PAIR-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-PAIR-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-COL-BSK-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-SRT-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
  ],
};
