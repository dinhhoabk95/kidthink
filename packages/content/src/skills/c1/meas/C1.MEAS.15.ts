import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_15_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.15",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Sắp xếp trật tự kích thước",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sequence", "compare"],
  tier: "core",
  prerequisites: ["C1.MEAS.01"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.15-01",
      behaviour:
        "Nhận biết và thực hành Sắp xếp trật tự kích thước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.15-02",
      behaviour:
        "Vận dụng Sắp xếp trật tự kích thước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.15-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Sắp xếp trật tự kích thước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_15_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.15",
  concept_label: "Sắp xếp trật tự kích thước",
  surface: "game",
  items: [
    {
      id: "meas15-i1",
      label: "chú kiến tí hon",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🐜",
      },
      ordering: 1,
      contrast_group: "size_small",
      category: {
        type: "kích thước nhỏ",
        size: "rất nhỏ",
      },
    },
    {
      id: "meas15-i2",
      label: "chú ong nhỏ",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      ordering: 2,
      contrast_group: "size_small",
      category: {
        type: "kích thước nhỏ",
        size: "nhỏ",
      },
    },
    {
      id: "meas15-i3",
      label: "chú chim vừa",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      ordering: 3,
      contrast_group: "size_medium",
      category: {
        type: "kích thước vừa",
        size: "vừa",
      },
    },
    {
      id: "meas15-i4",
      label: "chú thỏ vừa",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      ordering: 4,
      contrast_group: "size_medium",
      category: {
        type: "kích thước vừa",
        size: "vừa",
      },
    },
    {
      id: "meas15-i5",
      label: "chú gấu lớn",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🐻",
      },
      ordering: 5,
      contrast_group: "size_large",
      category: {
        type: "kích thước lớn",
        size: "lớn",
      },
    },
    {
      id: "meas15-i6",
      label: "chú voi khổng lồ",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      ordering: 6,
      contrast_group: "size_large",
      category: {
        type: "kích thước lớn",
        size: "rất lớn",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "meas15-i1",
      target_id: "meas15-i2",
    },
    {
      type: "sequence",
      source_id: "meas15-i2",
      target_id: "meas15-i3",
    },
    {
      type: "sequence",
      source_id: "meas15-i3",
      target_id: "meas15-i4",
    },
    {
      type: "sequence",
      source_id: "meas15-i4",
      target_id: "meas15-i5",
    },
    {
      type: "sequence",
      source_id: "meas15-i5",
      target_id: "meas15-i6",
    },
    {
      type: "contrast",
      source_id: "meas15-i6",
      target_id: "meas15-i1",
      metadata: {
        dimension: "size",
      },
    },
  ],
  axes: {
    size: {
      values: ["rất nhỏ", "nhỏ", "vừa", "lớn", "rất lớn"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với sắp xếp trật tự kích thước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng sắp xếp trật tự kích thước",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt sắp xếp trật tự kích thước với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi sắp xếp trật tự kích thước",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục sắp xếp trật tự kích thước và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về Sắp xếp trật tự kích thước nhé",
  },
  ordering: [
    "meas15-i1",
    "meas15-i2",
    "meas15-i3",
    "meas15-i4",
    "meas15-i5",
    "meas15-i6",
  ],
};

export const C1_MEAS_15_SEED: SkillSeed = {
  identity: C1_MEAS_15_IDENTITY,
  dataset: C1_MEAS_15_DATASET,
  levels: [
    {
      code: "GL-C1-COIN-CMP-0006",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-COIN-CMP-0009",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0045",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
