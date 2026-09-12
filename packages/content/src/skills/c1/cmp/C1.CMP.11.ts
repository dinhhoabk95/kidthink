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
      id: "weight_feather_less",
      label: "chiếc lông vũ rất nhẹ",
      glyph: "🪶",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🪶",
      },
      contrast_group: "weight",
      category: {
        weight: "rất nhẹ",
      },
    },
    {
      id: "weight_strawberry_less",
      label: "quả dâu tây nhẹ",
      glyph: "🍓",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      contrast_group: "weight",
      category: {
        weight: "nhẹ",
      },
    },
    {
      id: "weight_watermelon_more",
      label: "quả dưa hấu nặng",
      glyph: "🍉",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      contrast_group: "weight",
      category: {
        weight: "nặng",
      },
    },
    {
      id: "weight_stone_more",
      label: "hòn đá rất nặng",
      glyph: "🪨",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      contrast_group: "weight",
      category: {
        weight: "rất nặng",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "weight_feather_less",
      target_id: "weight_stone_more",
      metadata: {
        dimension: "weight",
      },
    },
    {
      type: "contrast",
      source_id: "weight_strawberry_less",
      target_id: "weight_watermelon_more",
      metadata: {
        dimension: "weight",
      },
    },
  ],
  axes: {
    weight: {
      values: ["rất nhẹ", "nhẹ", "nặng", "rất nặng"],
      ordered: true,
    },
  },
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
      description: "Nhận biết và chọn đúng nhẹ hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt nhẹ hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi nhẹ hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục nhẹ hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Vật nào nhẹ hơn hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Nhẹ hơn nhé",
  },
};

export const C1_CMP_11_SEED: SkillSeed = {
  identity: C1_CMP_11_IDENTITY,
  dataset: C1_CMP_11_DATASET,
  levels: [
    {
      code: "GL-C1-VOL-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D5-01",
    },
    {
      code: "GL-C1-CMP-TAP-0045",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0046",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0047",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "home",
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
      code: "GL-C1-CMP-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "food",
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
      code: "GL-C1-CMP-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0007",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "family",
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
    {
      code: "GL-C1-CMP-PATT-0048",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0049",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0050",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0051",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0048",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0049",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0050",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0051",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
  ],
};
