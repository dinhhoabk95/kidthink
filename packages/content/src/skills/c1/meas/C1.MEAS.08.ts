import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_08_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.08",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Đo bằng đơn vị phi chuẩn",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["count", "compare"],
  tier: "core",
  prerequisites: ["C1.MEAS.01", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.08-01",
      behaviour: "Nhận biết và thực hành Đo bằng đơn vị phi chuẩn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.08-02",
      behaviour: "Vận dụng Đo bằng đơn vị phi chuẩn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.08-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đo bằng đơn vị phi chuẩn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_08_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.08",
  concept_label: "Đo bằng đơn vị phi chuẩn",
  surface: "game",
  items: [
    {
      id: "meas08-i1",
      label: "gôm tẩy một gang",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🧽",
      },
      ordering: 1,
      contrast_group: "length_short",
      category: {
        type: "vật đo ngắn",
        length_unit: "1",
      },
    },
    {
      id: "meas08-i2",
      label: "bút chì hai gang",
      value: 2,
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      ordering: 2,
      contrast_group: "length_short",
      category: {
        type: "vật đo ngắn",
        length_unit: "2",
      },
    },
    {
      id: "meas08-i3",
      label: "hộp bút ba gang",
      value: 3,
      image: {
        kind: "emoji",
        ref: "📦",
      },
      ordering: 3,
      contrast_group: "length_medium",
      category: {
        type: "vật đo vừa",
        length_unit: "3",
      },
    },
    {
      id: "meas08-i4",
      label: "quyển sách bốn gang",
      value: 4,
      image: {
        kind: "emoji",
        ref: "📖",
      },
      ordering: 4,
      contrast_group: "length_medium",
      category: {
        type: "vật đo vừa",
        length_unit: "4",
      },
    },
    {
      id: "meas08-i5",
      label: "chiếc cặp năm gang",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      ordering: 5,
      contrast_group: "length_long",
      category: {
        type: "vật đo dài",
        length_unit: "5",
      },
    },
    {
      id: "meas08-i6",
      label: "mặt bàn sáu gang",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      ordering: 6,
      contrast_group: "length_long",
      category: {
        type: "vật đo dài",
        length_unit: "6",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "meas08-i1",
      target_id: "meas08-i2",
    },
    {
      type: "sequence",
      source_id: "meas08-i2",
      target_id: "meas08-i3",
    },
    {
      type: "sequence",
      source_id: "meas08-i3",
      target_id: "meas08-i4",
    },
    {
      type: "sequence",
      source_id: "meas08-i4",
      target_id: "meas08-i5",
    },
    {
      type: "sequence",
      source_id: "meas08-i5",
      target_id: "meas08-i6",
    },
    {
      type: "contrast",
      source_id: "meas08-i6",
      target_id: "meas08-i1",
      metadata: {
        dimension: "length",
      },
    },
  ],
  axes: {
    length_unit: {
      values: ["1", "2", "3", "4", "5", "6"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đo bằng đơn vị phi chuẩn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đo bằng đơn vị phi chuẩn",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt đo bằng đơn vị phi chuẩn với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đo bằng đơn vị phi chuẩn",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đo bằng đơn vị phi chuẩn và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về Đo bằng đơn vị phi chuẩn nhé",
  },
  ordering: [
    "meas08-i1",
    "meas08-i2",
    "meas08-i3",
    "meas08-i4",
    "meas08-i5",
    "meas08-i6",
  ],
};

export const C1_MEAS_08_SEED: SkillSeed = {
  identity: C1_MEAS_08_IDENTITY,
  dataset: C1_MEAS_08_DATASET,
  levels: [
    {
      code: "GL-C1-MEAS-UNIT-0001",
      template: "GT-030",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-UNIT-0002",
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-UNIT-0003",
      template: "GT-030",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-BAL-0001",
      template: "GT-014",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-BAL-0002",
      template: "GT-014",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
  ],
};
