import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_05_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.05",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Dung tích",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["compare", "predict"],
  tier: "core",
  prerequisites: ["C1.MEAS.04"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.05-01",
      behaviour: "Nhận biết và thực hành Dung tích ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.05-02",
      behaviour: "Vận dụng Dung tích trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Dung tích",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_05_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.05",
  concept_label: "Dung tích",
  surface: "game",
  items: [
    {
      id: "meas05-i1",
      label: "cốc rỗng nước",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      ordering: 1,
      contrast_group: "cap_empty",
      category: {
        type: "vật chứa rỗng",
        capacity: "rỗng",
      },
    },
    {
      id: "meas05-i2",
      label: "bình rỗng nước",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🏺",
      },
      ordering: 2,
      contrast_group: "cap_empty",
      category: {
        type: "vật chứa rỗng",
        capacity: "rỗng",
      },
    },
    {
      id: "meas05-i3",
      label: "bát rỗng canh",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      ordering: 3,
      contrast_group: "cap_empty",
      category: {
        type: "vật chứa rỗng",
        capacity: "rỗng",
      },
    },
    {
      id: "meas05-i4",
      label: "chai rỗng nước",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍾",
      },
      ordering: 4,
      contrast_group: "cap_empty",
      category: {
        type: "vật chứa rỗng",
        capacity: "rỗng",
      },
    },
    {
      id: "meas05-i5",
      label: "cốc đầy nước",
      value: 5,
      image: {
        kind: "emoji",
        ref: "☕",
      },
      ordering: 5,
      contrast_group: "cap_full",
      category: {
        type: "vật chứa đầy",
        capacity: "đầy",
      },
    },
    {
      id: "meas05-i6",
      label: "bình đầy nước",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🫖",
      },
      ordering: 6,
      contrast_group: "cap_full",
      category: {
        type: "vật chứa đầy",
        capacity: "đầy",
      },
    },
    {
      id: "meas05-i7",
      label: "bát đầy súp",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🍲",
      },
      ordering: 7,
      contrast_group: "cap_full",
      category: {
        type: "vật chứa đầy",
        capacity: "đầy",
      },
    },
    {
      id: "meas05-i8",
      label: "xô đầy nước",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🪣",
      },
      ordering: 8,
      contrast_group: "cap_full",
      category: {
        type: "vật chứa đầy",
        capacity: "đầy",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "meas05-i1",
      target_id: "meas05-i5",
      metadata: {
        dimension: "capacity",
      },
    },
    {
      type: "contrast",
      source_id: "meas05-i2",
      target_id: "meas05-i6",
      metadata: {
        dimension: "capacity",
      },
    },
    {
      type: "contrast",
      source_id: "meas05-i3",
      target_id: "meas05-i7",
      metadata: {
        dimension: "capacity",
      },
    },
    {
      type: "contrast",
      source_id: "meas05-i4",
      target_id: "meas05-i8",
      metadata: {
        dimension: "capacity",
      },
    },
  ],
  axes: {
    capacity: {
      values: ["rỗng", "đầy"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với dung tích",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng dung tích",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt dung tích với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi dung tích",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục dung tích và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Dung tích nhé",
  },
  ordering: [
    "meas05-i1",
    "meas05-i2",
    "meas05-i3",
    "meas05-i4",
    "meas05-i5",
    "meas05-i6",
    "meas05-i7",
    "meas05-i8",
  ],
};

export const C1_MEAS_05_SEED: SkillSeed = {
  identity: C1_MEAS_05_IDENTITY,
  dataset: C1_MEAS_05_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C1-LIQ-POUR-0001",
      template: "GT-032",
      band: "5-6",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-LIQ-POUR-0002",
      template: "GT-032",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-LIQ-POUR-0003",
      template: "GT-032",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-CAP-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-CAP-0002",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
