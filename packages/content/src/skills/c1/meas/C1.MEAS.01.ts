import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_01_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.01",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Dài ngắn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.06", "C1.CMP.07"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.01-01",
      behaviour: "Nhận biết và thực hành Dài ngắn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.01-02",
      behaviour: "Vận dụng Dài ngắn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Dài ngắn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_01_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.01",
  concept_label: "Dài ngắn",
  surface: "game",
  items: [
    {
      id: "meas01-i1",
      label: "con sâu ngắn",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🐛",
      },
      ordering: 1,
      contrast_group: "length_short",
      category: {
        type: "đồ vật ngắn",
        length: "ngắn",
      },
    },
    {
      id: "meas01-i2",
      label: "bút sáp ngắn",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
      ordering: 2,
      contrast_group: "length_short",
      category: {
        type: "đồ vật ngắn",
        length: "ngắn",
      },
    },
    {
      id: "meas01-i3",
      label: "kẹp giấy ngắn",
      value: 3,
      image: {
        kind: "emoji",
        ref: "📎",
      },
      ordering: 3,
      contrast_group: "length_short",
      category: {
        type: "đồ vật ngắn",
        length: "ngắn",
      },
    },
    {
      id: "meas01-i4",
      label: "xe con ngắn",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      ordering: 4,
      contrast_group: "length_short",
      category: {
        type: "đồ vật ngắn",
        length: "ngắn",
      },
    },
    {
      id: "meas01-i5",
      label: "bút chì dài",
      value: 5,
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      ordering: 5,
      contrast_group: "length_long",
      category: {
        type: "đồ vật dài",
        length: "dài",
      },
    },
    {
      id: "meas01-i6",
      label: "thước kẻ dài",
      value: 6,
      image: {
        kind: "emoji",
        ref: "📏",
      },
      ordering: 6,
      contrast_group: "length_long",
      category: {
        type: "đồ vật dài",
        length: "dài",
      },
    },
    {
      id: "meas01-i7",
      label: "con rắn dài",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🐍",
      },
      ordering: 7,
      contrast_group: "length_long",
      category: {
        type: "đồ vật dài",
        length: "dài",
      },
    },
    {
      id: "meas01-i8",
      label: "đoàn tàu dài",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      ordering: 8,
      contrast_group: "length_long",
      category: {
        type: "đồ vật dài",
        length: "dài",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "meas01-i1",
      target_id: "meas01-i7",
      metadata: {
        dimension: "length",
      },
    },
    {
      type: "contrast",
      source_id: "meas01-i2",
      target_id: "meas01-i6",
      metadata: {
        dimension: "length",
      },
    },
    {
      type: "contrast",
      source_id: "meas01-i3",
      target_id: "meas01-i5",
      metadata: {
        dimension: "length",
      },
    },
    {
      type: "contrast",
      source_id: "meas01-i4",
      target_id: "meas01-i8",
      metadata: {
        dimension: "length",
      },
    },
  ],
  axes: {
    length: {
      values: ["ngắn", "dài"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với dài ngắn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng dài ngắn",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt dài ngắn với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi dài ngắn",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục dài ngắn và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Dài ngắn nhé",
  },
  ordering: [
    "meas01-i1",
    "meas01-i2",
    "meas01-i3",
    "meas01-i4",
    "meas01-i5",
    "meas01-i6",
    "meas01-i7",
    "meas01-i8",
  ],
};

export const C1_MEAS_01_SEED: SkillSeed = {
  identity: C1_MEAS_01_IDENTITY,
  dataset: C1_MEAS_01_DATASET,
  levels: [
    {
      code: "GL-C1-MSR-UNIT-0001",
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MSR-UNIT-0002",
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-MSR-UNIT-0003",
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-SZO-ORD-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-SZO-ORD-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-SZO-ORD-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-RUL-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-RUL-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
  ],
};
