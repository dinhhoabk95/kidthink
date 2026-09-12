import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_12_IDENTITY: SkillIdentity = {
  code: "C1.CMP.12",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Xa hơn",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.12-01",
      behaviour: "Nhận biết và thực hành Xa hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.12-02",
      behaviour: "Vận dụng Xa hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.12-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Xa hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_12_DATASET: SkillDataset = {
  skill_code: "C1.CMP.12",
  concept_label: "Xa hơn",
  surface: "game",
  items: [
    {
      id: "dist_star_more",
      label: "ngôi sao rất xa",
      glyph: "⭐",
      value: 4,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      contrast_group: "distance",
      category: {
        distance: "rất xa",
      },
    },
    {
      id: "dist_cloud_more",
      label: "đám mây ở xa",
      glyph: "☁️",
      value: 3,
      image: {
        kind: "emoji",
        ref: "☁️",
      },
      contrast_group: "distance",
      category: {
        distance: "xa",
      },
    },
    {
      id: "dist_tree_less",
      label: "cây xanh ở gần",
      glyph: "🌳",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      contrast_group: "distance",
      category: {
        distance: "gần",
      },
    },
    {
      id: "dist_flower_less",
      label: "bông hoa rất gần",
      glyph: "🌸",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      contrast_group: "distance",
      category: {
        distance: "rất gần",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "dist_star_more",
      target_id: "dist_flower_less",
      metadata: {
        dimension: "distance",
      },
    },
    {
      type: "contrast",
      source_id: "dist_cloud_more",
      target_id: "dist_tree_less",
      metadata: {
        dimension: "distance",
      },
    },
  ],
  axes: {
    distance: {
      values: ["rất gần", "gần", "xa", "rất xa"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với xa hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng xa hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt xa hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi xa hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục xa hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Vật nào ở xa hơn hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Xa hơn nhé",
  },
};

export const C1_CMP_12_SEED: SkillSeed = {
  identity: C1_CMP_12_IDENTITY,
  dataset: C1_CMP_12_DATASET,
  levels: [
    {
      code: "GL-C1-VOL-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D5-01",
    },
    {
      code: "GL-C1-CMP-TAP-0048",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0049",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0050",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0010",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0011",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0012",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0009",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0010",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0011",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0012",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0052",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0053",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0054",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0055",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0052",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0053",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0054",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0055",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
