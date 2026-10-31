import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_08_IDENTITY: SkillIdentity = {
  code: "C5.ALP.08",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Chữ ghép: ngh · gh · gi · qu",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["observe", "solve"],
  tier: "advanced",
  prerequisites: ["C5.ALP.07", "C5.DGR.02"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.08-01",
      behaviour:
        "Nhận biết và thực hành Chữ ghép: ngh · gh · gi · qu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.08-02",
      behaviour:
        "Vận dụng Chữ ghép: ngh · gh · gi · qu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.08-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chữ ghép: ngh · gh · gi · qu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_08_DATASET: SkillDataset = {
  skill_code: "C5.ALP.08",
  concept_label: "Chữ ghép: ngh · gh · gi · qu",
  surface: "game",
  items: [
    {
      id: "dgr_gh",
      label: "chữ gh (cái ghế)",
      glyph: "gh",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "chữ ghép có g",
        label: "Chữ ghép có g",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "dgr_gi",
      label: "chữ gi (đôi giày)",
      glyph: "gi",
      image: {
        kind: "emoji",
        ref: "👟",
      },
      category: {
        type: "chữ ghép có g",
        label: "Chữ ghép có g",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "dgr_ngh",
      label: "chữ ngh (chú nghé)",
      glyph: "ngh",
      image: {
        kind: "emoji",
        ref: "🐮",
      },
      category: {
        type: "chữ ghép có g",
        label: "Chữ ghép có g",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "dgr_ng",
      label: "chữ ng (chú ngựa)",
      glyph: "ng",
      image: {
        kind: "emoji",
        ref: "🐴",
      },
      category: {
        type: "chữ ghép khác",
        label: "Chữ ghép khác",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "dgr_qu",
      label: "chữ qu (hộp quà)",
      glyph: "qu",
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "chữ ghép khác",
        label: "Chữ ghép khác",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "dgr_nh",
      label: "chữ nh (ngôi nhà)",
      glyph: "nh",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "chữ ghép khác",
        label: "Chữ ghép khác",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "dgr_gh",
      target_id: "dgr_gi",
      explanation: "chữ gh và chữ gi đều là chữ ghép có chữ g",
    },
    {
      type: "pair",
      source_id: "dgr_ng",
      target_id: "dgr_qu",
      explanation: "chữ ng và chữ qu đều là chữ ghép khác",
    },
    {
      type: "contrast",
      source_id: "dgr_gh",
      target_id: "dgr_ng",
      explanation: "khác nhóm chữ ghép",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ ghép: ngh · gh · gi · qu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ ghép: ngh · gh · gi · qu",
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
      "Chúng mình cùng tìm hiểu về Chữ ghép: ngh · gh · gi · qu nhé",
  },
  ordering: ["dgr_gh", "dgr_gi", "dgr_ngh", "dgr_ng", "dgr_qu", "dgr_nh"],
};

export const C5_ALP_08_SEED: SkillSeed = {
  identity: C5_ALP_08_IDENTITY,
  dataset: C5_ALP_08_DATASET,
  levels: [
    {
      code: "GL-C5-ALP-TAP-0015",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TAP-0016",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCNT-0013",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
  ],
};
