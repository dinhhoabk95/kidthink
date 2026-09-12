import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ORD_03_IDENTITY: SkillIdentity = {
  code: "C1.ORD.03",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Thứ tự đến thứ năm",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sequence", "count"],
  tier: "basic",
  prerequisites: ["C1.ORD.01"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.03-01",
      behaviour: "Nhận biết và thực hành Thứ tự đến thứ năm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.03-02",
      behaviour: "Vận dụng Thứ tự đến thứ năm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thứ tự đến thứ năm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_03_DATASET: SkillDataset = {
  skill_code: "C1.ORD.03",
  concept_label: "Thứ tự đến thứ năm",
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
      category: {
        ordinal: "thứ nhất",
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
      category: {
        ordinal: "thứ hai",
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
      category: {
        ordinal: "thứ ba",
      },
    },
    {
      id: "ord_4",
      label: "thứ tư",
      glyph: "4.",
      value: 4,
      image: {
        kind: "emoji",
        ref: "4️⃣",
      },
      category: {
        ordinal: "thứ tư",
      },
    },
    {
      id: "ord_5",
      label: "thứ năm",
      glyph: "5.",
      value: 5,
      image: {
        kind: "emoji",
        ref: "5️⃣",
      },
      category: {
        ordinal: "thứ năm",
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
    {
      type: "sequence",
      source_id: "ord_3",
      target_id: "ord_4",
    },
    {
      type: "sequence",
      source_id: "ord_4",
      target_id: "ord_5",
    },
  ],
  axes: {
    ordinal: {
      values: ["thứ nhất", "thứ hai", "thứ ba", "thứ tư", "thứ năm"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với thứ tự đến thứ năm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng thứ tự đến thứ năm",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt thứ tự đến thứ năm với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi thứ tự đến thứ năm",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục thứ tự đến thứ năm và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé tìm bạn đứng đúng thứ tự nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Thứ tự đến thứ năm nhé",
  },
  ordering: ["ord_1", "ord_2", "ord_3", "ord_4", "ord_5"],
};

export const C1_ORD_03_SEED: SkillSeed = {
  identity: C1_ORD_03_IDENTITY,
  dataset: C1_ORD_03_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-TAP-0009",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0010",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0011",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0012",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0010",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0011",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0012",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0009",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0010",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0011",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0012",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0005",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0006",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0007",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0008",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0015",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0016",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0017",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0018",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
