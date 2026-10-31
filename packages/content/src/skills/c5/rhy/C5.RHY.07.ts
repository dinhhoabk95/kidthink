import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_07_IDENTITY: SkillIdentity = {
  code: "C5.RHY.07",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Vần có nguyên âm đôi: ia · ua · ưa",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["solve", "compare"],
  tier: "advanced",
  prerequisites: ["C5.RHY.05", "C5.RIM.06"],
  learning_objectives: [
    {
      code: "LO-C5.RHY.07-01",
      behaviour:
        "Nhận biết và thực hành Vần có nguyên âm đôi: ia · ua · ưa ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RHY.07-02",
      behaviour:
        "Vận dụng Vần có nguyên âm đôi: ia · ua · ưa trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RHY.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Vần có nguyên âm đôi: ia · ua · ưa",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RHY_07_DATASET: SkillDataset = {
  skill_code: "C5.RHY.07",
  concept_label: "Vần có nguyên âm đôi: ia · ua · ưa",
  surface: "game",
  items: [
    {
      id: "rhy_ia",
      label: "vần ia (cái thìa)",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "vần ia ua",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "rhy_ua",
      label: "vần ua (con cua)",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      category: {
        type: "vần ia ua",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "rhy_ua_moc",
      label: "vần ưa (dưa hấu)",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "vần ia ua",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "rhy_ie",
      label: "vần iê (con kiến)",
      image: {
        kind: "emoji",
        ref: "🐜",
      },
      category: {
        type: "vần iê uô",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "rhy_uo_moc",
      label: "vần uô (quả chuối)",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "vần iê uô",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "rhy_uo_doi",
      label: "vần ươ (con bướm)",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "vần iê uô",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vần có nguyên âm đôi: ia · ua · ưa",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vần có nguyên âm đôi: ia · ua · ưa",
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
      "Chúng mình cùng tìm hiểu về Vần có nguyên âm đôi: ia · ua · ưa nhé",
  },
  ordering: [
    "rhy_ia",
    "rhy_ua",
    "rhy_ua_moc",
    "rhy_ie",
    "rhy_uo_moc",
    "rhy_uo_doi",
  ],
  axes: {
    category: {
      values: ["vần ia ua", "vần iê uô"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rhy_ia",
      target_id: "rhy_ua",
    },
    {
      type: "pair",
      source_id: "rhy_ie",
      target_id: "rhy_uo_moc",
    },
    {
      type: "contrast",
      source_id: "rhy_ia",
      target_id: "rhy_ie",
    },
  ],
};

export const C5_RHY_07_SEED: SkillSeed = {
  identity: C5_RHY_07_IDENTITY,
  dataset: C5_RHY_07_DATASET,
  levels: [
    {
      code: "GL-C5-RHY-TAP-0011",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TAP-0012",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TCNT-0007",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
