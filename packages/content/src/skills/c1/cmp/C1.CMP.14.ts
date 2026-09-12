import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_14_IDENTITY: SkillIdentity = {
  code: "C1.CMP.14",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Nhanh hơn",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.14-01",
      behaviour: "Nhận biết và thực hành Nhanh hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.14-02",
      behaviour: "Vận dụng Nhanh hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.14-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhanh hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_14_DATASET: SkillDataset = {
  skill_code: "C1.CMP.14",
  concept_label: "Nhanh hơn",
  surface: "game",
  items: [
    {
      id: "speed_rocket_more",
      label: "tên lửa rất nhanh",
      glyph: "🚀",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🚀",
      },
      contrast_group: "speed",
      category: {
        speed: "rất nhanh",
      },
    },
    {
      id: "speed_plane_more",
      label: "máy bay bay nhanh",
      glyph: "✈️",
      value: 3,
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      contrast_group: "speed",
      category: {
        speed: "nhanh",
      },
    },
    {
      id: "speed_bicycle_less",
      label: "xe đạp đi chậm",
      glyph: "🚲",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      contrast_group: "speed",
      category: {
        speed: "chậm",
      },
    },
    {
      id: "speed_turtle_less",
      label: "con rùa rất chậm",
      glyph: "🐢",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      contrast_group: "speed",
      category: {
        speed: "rất chậm",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "speed_rocket_more",
      target_id: "speed_turtle_less",
      metadata: {
        dimension: "speed",
      },
    },
    {
      type: "contrast",
      source_id: "speed_plane_more",
      target_id: "speed_bicycle_less",
      metadata: {
        dimension: "speed",
      },
    },
  ],
  axes: {
    speed: {
      values: ["rất chậm", "chậm", "nhanh", "rất nhanh"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với nhanh hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng nhanh hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt nhanh hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi nhanh hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục nhanh hơn và tự làm một mình",
      representation: "numeral",
    },
  ],
  phrasing: {
    prompt_template: "Con nào đi nhanh hơn hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Nhanh hơn nhé",
  },
};

export const C1_CMP_14_SEED: SkillSeed = {
  identity: C1_CMP_14_IDENTITY,
  dataset: C1_CMP_14_DATASET,
  levels: [
    {
      code: "GL-C1-HGT-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D5-02",
    },
    {
      code: "GL-C1-CMP-TAP-0054",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0055",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0056",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0017",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0018",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0019",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0020",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCMP-0008",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCMP-0009",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCMP-0010",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCMP-0011",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0017",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0018",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0019",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0020",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0060",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0061",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0062",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0063",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
