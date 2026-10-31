import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_04_IDENTITY: SkillIdentity = {
  code: "C5.RHY.04",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Vần một âm: a · o · e · i · u",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["match", "observe"],
  tier: "advanced",
  prerequisites: ["C5.RHY.02", "C5.ALP.03", "C5.RIM.01"],
  learning_objectives: [
    {
      code: "LO-C5.RHY.04-01",
      behaviour:
        "Nhận biết và thực hành Vần một âm: a · o · e · i · u ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RHY.04-02",
      behaviour:
        "Vận dụng Vần một âm: a · o · e · i · u trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RHY.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Vần một âm: a · o · e · i · u",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RHY_04_DATASET: SkillDataset = {
  skill_code: "C5.RHY.04",
  concept_label: "Vần một âm: a · o · e · i · u",
  surface: "game",
  items: [
    {
      id: "rhy_a",
      label: "vần a (con cá)",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "vần đơn một",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "rhy_o",
      label: "vần o (chùm nho)",
      image: {
        kind: "emoji",
        ref: "🍇",
      },
      category: {
        type: "vần đơn một",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "rhy_e",
      label: "vần e (em bé)",
      image: {
        kind: "emoji",
        ref: "👶",
      },
      category: {
        type: "vần đơn một",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "rhy_i",
      label: "vần i (viên bi)",
      image: {
        kind: "emoji",
        ref: "🔮",
      },
      category: {
        type: "vần đơn hai",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "rhy_u",
      label: "vần u (chim cú)",
      image: {
        kind: "emoji",
        ref: "🦉",
      },
      category: {
        type: "vần đơn hai",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "rhy_o_moc",
      label: "vần ơ (lá cờ)",
      image: {
        kind: "emoji",
        ref: "🚩",
      },
      category: {
        type: "vần đơn hai",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vần một âm: a · o · e · i · u",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vần một âm: a · o · e · i · u",
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
    narration_template:
      "Chúng mình cùng tìm hiểu về Vần một âm: a · o · e · i · u nhé",
  },
  ordering: ["rhy_a", "rhy_o", "rhy_e", "rhy_i", "rhy_u", "rhy_o_moc"],
  axes: {
    category: {
      values: ["vần đơn một", "vần đơn hai"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rhy_a",
      target_id: "rhy_o",
    },
    {
      type: "pair",
      source_id: "rhy_i",
      target_id: "rhy_u",
    },
    {
      type: "contrast",
      source_id: "rhy_a",
      target_id: "rhy_i",
    },
  ],
};

export const C5_RHY_04_SEED: SkillSeed = {
  identity: C5_RHY_04_IDENTITY,
  dataset: C5_RHY_04_DATASET,
  levels: [
    {
      code: "GL-C5-RHY-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
  ],
};
