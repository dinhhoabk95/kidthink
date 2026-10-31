import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_11_IDENTITY: SkillIdentity = {
  code: "C1.CMP.11",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Nhẹ hơn",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.11-01",
      behaviour: "Nhận biết và thực hành Nhẹ hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.11-02",
      behaviour: "Vận dụng Nhẹ hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.11-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhẹ hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_11_DATASET: SkillDataset = {
  skill_code: "C1.CMP.11",
  concept_label: "Nhẹ hơn",
  surface: "game",
  items: [
    {
      id: "cmp11_bird",
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
      id: "cmp11_bike",
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
      id: "cmp11_strawberry",
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
      id: "cmp11_leaf",
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
      id: "cmp11_watermelon",
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
      id: "cmp11_rock",
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
      id: "cmp11_truck",
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
      id: "cmp11_elephant",
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
      source_id: "cmp11_bird",
      target_id: "cmp11_watermelon",
    },
    {
      type: "contrast",
      source_id: "cmp11_bike",
      target_id: "cmp11_rock",
    },
    {
      type: "contrast",
      source_id: "cmp11_strawberry",
      target_id: "cmp11_truck",
    },
    {
      type: "contrast",
      source_id: "cmp11_leaf",
      target_id: "cmp11_elephant",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với nhẹ hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng theo yêu cầu nhẹ hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt theo yêu cầu nhẹ hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so sánh nhẹ hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so sánh nhẹ hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm vật nhẹ hơn nhé",
  },
  ordering: [
    "cmp11_bird",
    "cmp11_bike",
    "cmp11_strawberry",
    "cmp11_leaf",
    "cmp11_watermelon",
    "cmp11_rock",
    "cmp11_truck",
    "cmp11_elephant",
  ],
};

export const C1_CMP_11_SEED: SkillSeed = {
  identity: C1_CMP_11_IDENTITY,
  dataset: C1_CMP_11_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C1-VOL-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0008",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0008",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
  ],
};
