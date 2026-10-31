import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_09_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.09",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Đo bằng thước",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["count", "verify"],
  tier: "advanced",
  prerequisites: ["C1.MEAS.08"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.09-01",
      behaviour: "Nhận biết và thực hành Đo bằng thước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.09-02",
      behaviour: "Vận dụng Đo bằng thước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đo bằng thước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_09_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.09",
  concept_label: "Đo bằng thước",
  surface: "game",
  items: [
    {
      id: "meas09-i1",
      label: "kẹp giấy một xăng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "📎",
      },
      ordering: 1,
      contrast_group: "length_short",
      category: {
        type: "vật đo ngắn",
        cm: "1",
      },
    },
    {
      id: "meas09-i2",
      label: "cục tẩy hai xăng",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🧽",
      },
      ordering: 2,
      contrast_group: "length_short",
      category: {
        type: "vật đo ngắn",
        cm: "2",
      },
    },
    {
      id: "meas09-i3",
      label: "bút sáp ba xăng",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
      ordering: 3,
      contrast_group: "length_medium",
      category: {
        type: "vật đo vừa",
        cm: "3",
      },
    },
    {
      id: "meas09-i4",
      label: "bút chì bốn xăng",
      value: 4,
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      ordering: 4,
      contrast_group: "length_medium",
      category: {
        type: "vật đo vừa",
        cm: "4",
      },
    },
    {
      id: "meas09-i5",
      label: "cây kéo năm xăng",
      value: 5,
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      ordering: 5,
      contrast_group: "length_long",
      category: {
        type: "vật đo dài",
        cm: "5",
      },
    },
    {
      id: "meas09-i6",
      label: "thước kẻ sáu xăng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "📏",
      },
      ordering: 6,
      contrast_group: "length_long",
      category: {
        type: "vật đo dài",
        cm: "6",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "meas09-i1",
      target_id: "meas09-i2",
    },
    {
      type: "sequence",
      source_id: "meas09-i2",
      target_id: "meas09-i3",
    },
    {
      type: "sequence",
      source_id: "meas09-i3",
      target_id: "meas09-i4",
    },
    {
      type: "sequence",
      source_id: "meas09-i4",
      target_id: "meas09-i5",
    },
    {
      type: "sequence",
      source_id: "meas09-i5",
      target_id: "meas09-i6",
    },
    {
      type: "contrast",
      source_id: "meas09-i6",
      target_id: "meas09-i1",
      metadata: {
        dimension: "length",
      },
    },
  ],
  axes: {
    cm: {
      values: ["1", "2", "3", "4", "5", "6"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đo bằng thước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đo bằng thước",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt đo bằng thước với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đo bằng thước",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đo bằng thước và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Đo bằng thước nhé",
  },
  ordering: [
    "meas09-i1",
    "meas09-i2",
    "meas09-i3",
    "meas09-i4",
    "meas09-i5",
    "meas09-i6",
  ],
};

export const C1_MEAS_09_SEED: SkillSeed = {
  identity: C1_MEAS_09_IDENTITY,
  dataset: C1_MEAS_09_DATASET,
  levels: [
    {
      code: "GL-C1-MEAS-TCNT-0021",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SHAD-0020",
      template: "GT-007",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SHAD-0021",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SHAD-0022",
      template: "GT-007",
      band: "5-6",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SHAD-0023",
      template: "GT-007",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
