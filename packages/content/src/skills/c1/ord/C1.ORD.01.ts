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
      id: "ord01-i1",
      label: "quả táo đỏ thứ nhất",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "nhóm đầu",
        ordinal: "thứ nhất",
      },
      contrast_group: "ord_1_6",
    },
    {
      id: "ord01-i2",
      label: "quả cam vàng thứ hai",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "nhóm đầu",
        ordinal: "thứ hai",
      },
      contrast_group: "ord_1_6",
    },
    {
      id: "ord01-i3",
      label: "quả dâu tây thứ ba",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "nhóm đầu",
        ordinal: "thứ ba",
      },
      contrast_group: "ord_1_6",
    },
    {
      id: "ord01-i4",
      label: "quả chuối vàng thứ tư",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "nhóm sau",
        ordinal: "thứ tư",
      },
      contrast_group: "ord_1_6",
    },
    {
      id: "ord01-i5",
      label: "chùm nho tím thứ năm",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍇",
      },
      category: {
        type: "nhóm sau",
        ordinal: "thứ năm",
      },
      contrast_group: "ord_1_6",
    },
    {
      id: "ord01-i6",
      label: "miếng dưa hấu thứ sáu",
      glyph: "6",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "nhóm sau",
        ordinal: "thứ sáu",
      },
      contrast_group: "ord_1_6",
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "ord01-i1",
      target_id: "ord01-i2",
    },
    {
      type: "sequence",
      source_id: "ord01-i2",
      target_id: "ord01-i3",
    },
    {
      type: "sequence",
      source_id: "ord01-i3",
      target_id: "ord01-i4",
    },
    {
      type: "sequence",
      source_id: "ord01-i4",
      target_id: "ord01-i5",
    },
    {
      type: "sequence",
      source_id: "ord01-i5",
      target_id: "ord01-i6",
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
      description: "Làm quen cơ bản với thứ nhất · thứ hai · thứ ba",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng thứ nhất · thứ hai · thứ ba",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt thứ nhất · thứ hai · thứ ba với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi thứ nhất · thứ hai · thứ ba",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục thứ nhất · thứ hai · thứ ba và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về thứ nhất, thứ hai, thứ ba nhé",
  },
  ordering: [
    "ord01-i1",
    "ord01-i2",
    "ord01-i3",
    "ord01-i4",
    "ord01-i5",
    "ord01-i6",
  ],
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
      code: "GL-C1-ORD-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
