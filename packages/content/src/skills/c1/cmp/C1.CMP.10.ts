import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_10_IDENTITY: SkillIdentity = {
  code: "C1.CMP.10",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Nặng hơn",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.10-01",
      behaviour: "Nhận biết và thực hành Nặng hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.10-02",
      behaviour: "Vận dụng Nặng hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.10-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nặng hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

const TOPIC_CMP_MEASURE_SPEED_DATASET: SkillDataset = {
  skill_code: "C1.CMP.10",
  concept_label: "So sánh độ nặng",
  surface: "game",
  items: [
    {
      id: "topic_light_bird",
      label: "con chim nhỏ",
      glyph: "🐦",
      value: 1,
      contrast_group: "weight",
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "vật nhẹ hơn",
      },
    },
    {
      id: "topic_light_leaf",
      label: "chiếc lá nhẹ",
      glyph: "🍃",
      value: 2,
      contrast_group: "weight",
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "vật nhẹ hơn",
      },
    },
    {
      id: "topic_heavy_rock",
      label: "tảng đá nặng",
      glyph: "🪨",
      value: 4,
      contrast_group: "weight",
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "vật nặng hơn",
      },
    },
    {
      id: "topic_heavy_elephant",
      label: "con voi nặng",
      glyph: "🐘",
      value: 5,
      contrast_group: "weight",
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "vật nặng hơn",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "topic_light_bird",
      target_id: "topic_heavy_elephant",
    },
    {
      type: "contrast",
      source_id: "topic_light_leaf",
      target_id: "topic_heavy_rock",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so sánh",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng so sánh độ nặng nhé",
  },
  ordering: [
    "topic_light_bird",
    "topic_light_leaf",
    "topic_heavy_rock",
    "topic_heavy_elephant",
  ],
};

export const C1_CMP_10_DATASET: SkillDataset = {
  skill_code: "C1.CMP.10",
  concept_label: "Nặng hơn",
  surface: "game",
  items: [
    {
      id: "cmp10_bird",
      label: "con chim nhỏ",
      glyph: "🐦",
      value: 1,
      contrast_group: "weight",
      ordering: 1,
      category: {
        type: "vật nhẹ hơn",
      },
      image: {
        kind: "emoji",
        ref: "🐦",
      },
    },
    {
      id: "cmp10_bike",
      label: "xe đạp nhẹ",
      glyph: "🚲",
      value: 1,
      contrast_group: "weight",
      ordering: 2,
      category: {
        type: "vật nhẹ hơn",
      },
      image: {
        kind: "emoji",
        ref: "🚲",
      },
    },
    {
      id: "cmp10_strawberry",
      label: "quả dâu tây",
      glyph: "🍓",
      value: 2,
      contrast_group: "weight",
      ordering: 3,
      category: {
        type: "vật nhẹ hơn",
      },
      image: {
        kind: "emoji",
        ref: "🍓",
      },
    },
    {
      id: "cmp10_leaf",
      label: "chiếc lá nhẹ",
      glyph: "🍃",
      value: 2,
      contrast_group: "weight",
      ordering: 4,
      category: {
        type: "vật nhẹ hơn",
      },
      image: {
        kind: "emoji",
        ref: "🍃",
      },
    },
    {
      id: "cmp10_watermelon",
      label: "quả dưa hấu",
      glyph: "🍉",
      value: 4,
      contrast_group: "weight",
      ordering: 5,
      category: {
        type: "vật nặng hơn",
      },
      image: {
        kind: "emoji",
        ref: "🍉",
      },
    },
    {
      id: "cmp10_rock",
      label: "tảng đá lớn",
      glyph: "🪨",
      value: 5,
      contrast_group: "weight",
      ordering: 6,
      category: {
        type: "vật nặng hơn",
      },
      image: {
        kind: "emoji",
        ref: "🪨",
      },
    },
    {
      id: "cmp10_truck",
      label: "xe tải lớn",
      glyph: "🚛",
      value: 5,
      contrast_group: "weight",
      ordering: 7,
      category: {
        type: "vật nặng hơn",
      },
      image: {
        kind: "emoji",
        ref: "🚛",
      },
    },
    {
      id: "cmp10_elephant",
      label: "con voi lớn",
      glyph: "🐘",
      value: 5,
      contrast_group: "weight",
      ordering: 8,
      category: {
        type: "vật nặng hơn",
      },
      image: {
        kind: "emoji",
        ref: "🐘",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "cmp10_bird",
      target_id: "cmp10_elephant",
    },
    {
      type: "contrast",
      source_id: "cmp10_bike",
      target_id: "cmp10_truck",
    },
    {
      type: "contrast",
      source_id: "cmp10_strawberry",
      target_id: "cmp10_watermelon",
    },
    {
      type: "contrast",
      source_id: "cmp10_leaf",
      target_id: "cmp10_rock",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với vật nặng hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng vật nặng hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt vật nặng hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng so sánh vật nặng hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so sánh nặng hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm vật nặng hơn nhé",
  },
  ordering: [
    "cmp10_bird",
    "cmp10_bike",
    "cmp10_strawberry",
    "cmp10_leaf",
    "cmp10_watermelon",
    "cmp10_rock",
    "cmp10_truck",
    "cmp10_elephant",
  ],
};

export const C1_CMP_10_SEED: SkillSeed = {
  identity: C1_CMP_10_IDENTITY,
  dataset: C1_CMP_10_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-INTRO-0004",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 1,
      dataset: TOPIC_CMP_MEASURE_SPEED_DATASET,
      sequence_no: 1,
      skill_codes: [
        "C1.CMP.10",
        "C1.CMP.11",
        "C1.CMP.12",
        "C1.CMP.13",
        "C1.CMP.14",
        "C1.CMP.15",
      ],
    },
    {
      code: "GL-C1-VOL-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
