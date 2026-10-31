import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_ATT_03_IDENTITY: SkillIdentity = {
  code: "C6.ATT.03",
  strand_code: "C6.ATT",
  competency_code: "C6",
  name: "Bỏ qua vật gây nhiễu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["observe", "inhibit"],
  tier: "core",
  prerequisites: ["C6.ATT.02"],
  learning_objectives: [
    {
      code: "LO-C6.ATT.03-01",
      behaviour: "Nhận biết và thực hành Bỏ qua vật gây nhiễu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.ATT.03-02",
      behaviour: "Vận dụng Bỏ qua vật gây nhiễu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.ATT.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Bỏ qua vật gây nhiễu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_ATT_03_DATASET: SkillDataset = {
  skill_code: "C6.ATT.03",
  concept_label: "Bỏ qua vật gây nhiễu",
  surface: "game",
  items: [
    {
      id: "bus",
      label: "xe buýt lớn",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "xe cộ",
      },
      contrast_group: "vehicles",
    },
    {
      id: "minibus",
      label: "xe buýt nhỏ",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "🚐",
      },
      category: {
        type: "xe cộ",
      },
      contrast_group: "vehicles",
    },
    {
      id: "firetruck",
      label: "xe cứu hoả",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "🚒",
      },
      category: {
        type: "xe cộ",
      },
      contrast_group: "vehicles",
    },
    {
      id: "ambulance",
      label: "xe cứu thương",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "🚑",
      },
      category: {
        type: "xe cộ",
      },
      contrast_group: "vehicles",
    },
    {
      id: "ruler",
      label: "thước kẻ thẳng",
      value: 5,
      ordering: 5,
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "đồ học tập",
      },
      contrast_group: "study_tools",
    },
    {
      id: "set_square",
      label: "thước ê-ke",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "📐",
      },
      category: {
        type: "đồ học tập",
      },
      contrast_group: "study_tools",
    },
    {
      id: "scissors",
      label: "cái kéo nhỏ",
      value: 7,
      ordering: 7,
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "đồ học tập",
      },
      contrast_group: "study_tools",
    },
    {
      id: "paperclip",
      label: "kẹp giấy",
      value: 8,
      ordering: 8,
      image: {
        kind: "emoji",
        ref: "📎",
      },
      category: {
        type: "đồ học tập",
      },
      contrast_group: "study_tools",
    },
  ],
  axes: {
    type: ["xe cộ", "đồ học tập"],
  },
  relations: [
    {
      type: "pair",
      source_id: "bus",
      target_id: "minibus",
      metadata: { reason: "confusable" },
    },
    {
      type: "pair",
      source_id: "firetruck",
      target_id: "ambulance",
      metadata: { reason: "confusable" },
    },
    {
      type: "pair",
      source_id: "ruler",
      target_id: "set_square",
      metadata: { reason: "confusable" },
    },
    {
      type: "pair",
      source_id: "scissors",
      target_id: "paperclip",
      metadata: { reason: "confusable" },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Bỏ qua vật gây nhiễu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Bỏ qua vật gây nhiễu",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi và số lượng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục và độc lập thực hiện",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tập trung chú ý và chọn đúng hình nhé",
  },
  ordering: [
    "bus",
    "minibus",
    "firetruck",
    "ambulance",
    "ruler",
    "set_square",
    "scissors",
    "paperclip",
  ],
};

export const C6_ATT_03_SEED: SkillSeed = {
  identity: C6_ATT_03_IDENTITY,
  dataset: C6_ATT_03_DATASET,
  levels: [
    {
      code: "GL-C6-ATT-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-SWT-0001",
      template: "GT-027",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-SWT-0002",
      template: "GT-027",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-HUNT-0004",
      template: "GT-037",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-ATT-HUNT-0005",
      template: "GT-037",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      template: "GT-026",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
    },
  ],
};
