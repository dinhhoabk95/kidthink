import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_03_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.03",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Nặng nhẹ",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.10", "C1.CMP.11"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.03-01",
      behaviour: "Nhận biết và thực hành Nặng nhẹ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.03-02",
      behaviour: "Vận dụng Nặng nhẹ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nặng nhẹ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_03_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.03",
  concept_label: "Nặng nhẹ",
  surface: "game",
  items: [
    {
      id: "meas03-i1",
      label: "con kiến nhẹ",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🐜",
      },
      ordering: 1,
      contrast_group: "weight_light",
      category: {
        type: "vật nhẹ cân",
        weight: "nhẹ",
      },
    },
    {
      id: "meas03-i2",
      label: "chiếc lá nhẹ",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      ordering: 2,
      contrast_group: "weight_light",
      category: {
        type: "vật nhẹ cân",
        weight: "nhẹ",
      },
    },
    {
      id: "meas03-i3",
      label: "quả dâu nhẹ",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      ordering: 3,
      contrast_group: "weight_light",
      category: {
        type: "vật nhẹ cân",
        weight: "nhẹ",
      },
    },
    {
      id: "meas03-i4",
      label: "xe đạp nhẹ",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      ordering: 4,
      contrast_group: "weight_light",
      category: {
        type: "vật nhẹ cân",
        weight: "nhẹ",
      },
    },
    {
      id: "meas03-i5",
      label: "quả dưa nặng",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      ordering: 5,
      contrast_group: "weight_heavy",
      category: {
        type: "vật nặng cân",
        weight: "nặng",
      },
    },
    {
      id: "meas03-i6",
      label: "tảng đá nặng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      ordering: 6,
      contrast_group: "weight_heavy",
      category: {
        type: "vật nặng cân",
        weight: "nặng",
      },
    },
    {
      id: "meas03-i7",
      label: "xe tải nặng",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🚛",
      },
      ordering: 7,
      contrast_group: "weight_heavy",
      category: {
        type: "vật nặng cân",
        weight: "nặng",
      },
    },
    {
      id: "meas03-i8",
      label: "con voi nặng",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      ordering: 8,
      contrast_group: "weight_heavy",
      category: {
        type: "vật nặng cân",
        weight: "nặng",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "meas03-i1",
      target_id: "meas03-i8",
      metadata: {
        dimension: "weight",
      },
    },
    {
      type: "contrast",
      source_id: "meas03-i2",
      target_id: "meas03-i6",
      metadata: {
        dimension: "weight",
      },
    },
    {
      type: "contrast",
      source_id: "meas03-i3",
      target_id: "meas03-i5",
      metadata: {
        dimension: "weight",
      },
    },
    {
      type: "contrast",
      source_id: "meas03-i4",
      target_id: "meas03-i7",
      metadata: {
        dimension: "weight",
      },
    },
  ],
  axes: {
    weight: {
      values: ["nhẹ", "nặng"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với nặng nhẹ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng nặng nhẹ",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt nặng nhẹ với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi nặng nhẹ",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục nặng nhẹ và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Nặng nhẹ nhé",
  },
  ordering: [
    "meas03-i1",
    "meas03-i2",
    "meas03-i3",
    "meas03-i4",
    "meas03-i5",
    "meas03-i6",
    "meas03-i7",
    "meas03-i8",
  ],
};

export const C1_MEAS_03_SEED: SkillSeed = {
  identity: C1_MEAS_03_IDENTITY,
  dataset: C1_MEAS_03_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C1-RUL-SLOT-0007",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-BAL-OBJ-0001",
      template: "GT-014",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-BAL-OBJ-0002",
      template: "GT-014",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-BAL-OBJ-0003",
      template: "GT-014",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
  ],
};
