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
      id: "ord03-i1",
      label: "chú ngựa về thứ nhất",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🐎",
      },
      category: {
        type: "nhóm đầu",
        ordinal: "thứ nhất",
      },
      contrast_group: "ord_1_5",
    },
    {
      id: "ord03-i2",
      label: "chú cún về thứ hai",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "nhóm đầu",
        ordinal: "thứ hai",
      },
      contrast_group: "ord_1_5",
    },
    {
      id: "ord03-i3",
      label: "chú thỏ về thứ ba",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🐇",
      },
      category: {
        type: "nhóm đầu",
        ordinal: "thứ ba",
      },
      contrast_group: "ord_1_5",
    },
    {
      id: "ord03-i4",
      label: "chú cáo về thứ tư",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🦊",
      },
      category: {
        type: "nhóm sau",
        ordinal: "thứ tư",
      },
      contrast_group: "ord_1_5",
    },
    {
      id: "ord03-i5",
      label: "chú mèo về thứ năm",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "nhóm sau",
        ordinal: "thứ năm",
      },
      contrast_group: "ord_1_5",
    },
    {
      id: "ord03-i6",
      label: "chú vịt về thứ sáu",
      glyph: "6",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "nhóm sau",
        ordinal: "thứ sáu",
      },
      contrast_group: "ord_1_5",
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "ord03-i1",
      target_id: "ord03-i2",
    },
    {
      type: "sequence",
      source_id: "ord03-i2",
      target_id: "ord03-i3",
    },
    {
      type: "sequence",
      source_id: "ord03-i3",
      target_id: "ord03-i4",
    },
    {
      type: "sequence",
      source_id: "ord03-i4",
      target_id: "ord03-i5",
    },
    {
      type: "sequence",
      source_id: "ord03-i5",
      target_id: "ord03-i6",
    },
  ],
  axes: {
    ordinal: {
      values: ["thứ nhất", "thứ hai", "thứ ba", "thứ tư", "thứ năm", "thứ sáu"],
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
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về thứ tự đến thứ năm nhé",
  },
  ordering: [
    "ord03-i1",
    "ord03-i2",
    "ord03-i3",
    "ord03-i4",
    "ord03-i5",
    "ord03-i6",
  ],
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
      code: "GL-C1-ORD-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
  ],
};
