import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_06_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.06",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Thể tích trực quan",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["compare", "infer"],
  tier: "advanced",
  prerequisites: ["C1.MEAS.05"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.06-01",
      behaviour: "Nhận biết và thực hành Thể tích trực quan ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.06-02",
      behaviour: "Vận dụng Thể tích trực quan trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thể tích trực quan",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_06_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.06",
  concept_label: "Thể tích trực quan",
  surface: "game",
  items: [
    {
      id: "meas06-i1",
      label: "hộp nhỏ bé",
      value: 1,
      image: {
        kind: "emoji",
        ref: "📦",
      },
      ordering: 1,
      contrast_group: "size_small",
      category: {
        type: "vật thể nhỏ",
        volume: "nhỏ",
      },
    },
    {
      id: "meas06-i2",
      label: "túi nhỏ bé",
      value: 2,
      image: {
        kind: "emoji",
        ref: "👛",
      },
      ordering: 2,
      contrast_group: "size_small",
      category: {
        type: "vật thể nhỏ",
        volume: "nhỏ",
      },
    },
    {
      id: "meas06-i3",
      label: "lọ nhỏ bé",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🧪",
      },
      ordering: 3,
      contrast_group: "size_small",
      category: {
        type: "vật thể nhỏ",
        volume: "nhỏ",
      },
    },
    {
      id: "meas06-i4",
      label: "bát nhỏ bé",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      ordering: 4,
      contrast_group: "size_small",
      category: {
        type: "vật thể nhỏ",
        volume: "nhỏ",
      },
    },
    {
      id: "meas06-i5",
      label: "hộp to lớn",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      ordering: 5,
      contrast_group: "size_large",
      category: {
        type: "vật thể to",
        volume: "to",
      },
    },
    {
      id: "meas06-i6",
      label: "vali to lớn",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🧳",
      },
      ordering: 6,
      contrast_group: "size_large",
      category: {
        type: "vật thể to",
        volume: "to",
      },
    },
    {
      id: "meas06-i7",
      label: "thùng to lớn",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🛢️",
      },
      ordering: 7,
      contrast_group: "size_large",
      category: {
        type: "vật thể to",
        volume: "to",
      },
    },
    {
      id: "meas06-i8",
      label: "chậu to lớn",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🪴",
      },
      ordering: 8,
      contrast_group: "size_large",
      category: {
        type: "vật thể to",
        volume: "to",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "meas06-i1",
      target_id: "meas06-i5",
      metadata: {
        dimension: "volume",
      },
    },
    {
      type: "contrast",
      source_id: "meas06-i2",
      target_id: "meas06-i6",
      metadata: {
        dimension: "volume",
      },
    },
    {
      type: "contrast",
      source_id: "meas06-i3",
      target_id: "meas06-i7",
      metadata: {
        dimension: "volume",
      },
    },
    {
      type: "contrast",
      source_id: "meas06-i4",
      target_id: "meas06-i8",
      metadata: {
        dimension: "volume",
      },
    },
  ],
  axes: {
    volume: {
      values: ["nhỏ", "to"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với thể tích trực quan",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng thể tích trực quan",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt thể tích trực quan với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi thể tích trực quan",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục thể tích trực quan và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Thể tích trực quan nhé",
  },
  ordering: [
    "meas06-i1",
    "meas06-i2",
    "meas06-i3",
    "meas06-i4",
    "meas06-i5",
    "meas06-i6",
    "meas06-i7",
    "meas06-i8",
  ],
};

export const C1_MEAS_06_SEED: SkillSeed = {
  identity: C1_MEAS_06_IDENTITY,
  dataset: C1_MEAS_06_DATASET,
  levels: [
    {
      code: "GL-C1-LIQ-POUR-0006",
      template: "GT-032",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-LIQ-POUR-0009",
      template: "GT-032",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-HGT-TAP-0004",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
  ],
};
