import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ORD_01_IDENTITY: SkillIdentity = {
  code: "C1.ORD.01",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Thứ nhất · thứ hai · thứ ba",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sequence", "count"],
  tier: "basic",
  prerequisites: ["C1.NREC.02", "C1.NREC.09"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.01-01",
      behaviour:
        "Nhận biết và thực hành Thứ nhất · thứ hai · thứ ba ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.01-02",
      behaviour:
        "Vận dụng Thứ nhất · thứ hai · thứ ba trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thứ nhất · thứ hai · thứ ba",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_01_DATASET: SkillDataset = {
  skill_code: "C1.ORD.01",
  concept_label: "Thứ nhất · thứ hai · thứ ba",
  surface: "game",
  items: [
    {
      id: "ord_1",
      label: "thứ nhất",
      glyph: "1.",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🥇",
      },
    },
    {
      id: "ord_2",
      label: "thứ hai",
      glyph: "2.",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🥈",
      },
    },
    {
      id: "ord_3",
      label: "thứ ba",
      glyph: "3.",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🥉",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "ord_1",
      target_id: "ord_2",
    },
    {
      type: "sequence",
      source_id: "ord_2",
      target_id: "ord_3",
    },
  ],
  axes: {
    ordinal: {
      values: ["thứ nhất", "thứ hai", "thứ ba"],
      ordered: true,
    },
  },
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
      description: "Mở rộng phạm vi và số lượng",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục và độc lập thực hiện",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bạn nào đứng thứ {position}?",
    narration_template:
      "Chúng mình cùng tìm hiểu về Thứ nhất · thứ hai · thứ ba nhé",
  },
  ordering: ["ord_1", "ord_2", "ord_3"],
};

export const C1_ORD_01_SEED: SkillSeed = {
  identity: C1_ORD_01_IDENTITY,
  dataset: C1_ORD_01_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0011",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0012",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0013",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0014",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
