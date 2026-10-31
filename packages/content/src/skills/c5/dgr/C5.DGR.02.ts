import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DGR_02_IDENTITY: SkillIdentity = {
  code: "C5.DGR.02",
  strand_code: "C5.DGR",
  competency_code: "C5",
  name: "Chữ ghép có ng: ng · ngh",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["observe", "compare"],
  tier: "advanced",
  prerequisites: ["C5.DGR.01"],
  learning_objectives: [
    {
      code: "LO-C5.DGR.02-01",
      behaviour: "Nhận biết và thực hành Chữ ghép có ng: ng · ngh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DGR.02-02",
      behaviour:
        "Phân biệt và so sánh Chữ ghép có ng: ng · ngh trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DGR.02-03",
      behaviour: "Vận dụng và ghi nhớ Chữ ghép có ng: ng · ngh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DGR_02_DATASET: SkillDataset = {
  skill_code: "C5.DGR.02",
  concept_label: "Chữ ghép có ng: ng · ngh",
  surface: "game",
  items: [
    {
      id: "dgr_ng",
      label: "chữ ng (chú ngựa)",
      glyph: "ng",
      image: {
        kind: "emoji",
        ref: "🐴",
      },
      category: {
        type: "chữ ghép ng ngh",
        label: "Chữ ghép ng và ngh",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
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
        type: "chữ ghép ng ngh",
        label: "Chữ ghép ng và ngh",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "dgr_ng_ngo",
      label: "chữ ng (bắp ngô)",
      glyph: "ng",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "chữ ghép ng ngh",
        label: "Chữ ghép ng và ngh",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
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
      value: 4,
      ordering: 4,
    },
    {
      id: "dgr_ch",
      label: "chữ ch (chú chó)",
      glyph: "ch",
      image: {
        kind: "emoji",
        ref: "🐶",
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
      id: "dgr_kh",
      label: "chữ kh (chú khỉ)",
      glyph: "kh",
      image: {
        kind: "emoji",
        ref: "🐒",
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
  axes: {
    category: {
      values: ["chữ ghép ng ngh", "chữ ghép khác"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "dgr_ng",
      target_id: "dgr_ngh",
      explanation: "cùng là chữ ghép ng hoặc ngh",
    },
    {
      type: "pair",
      source_id: "dgr_nh",
      target_id: "dgr_ch",
      explanation: "cùng là các chữ ghép khác",
    },
    {
      type: "contrast",
      source_id: "dgr_ng",
      target_id: "dgr_nh",
      explanation: "chữ ghép ng ngh đối lập với chữ ghép khác",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ ghép có ng: ng · ngh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ ghép có ng: ng · ngh",
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
      "Chúng mình cùng tìm hiểu về Chữ ghép có ng: ng · ngh nhé",
  },
  ordering: ["dgr_ng", "dgr_ngh", "dgr_ng_ngo", "dgr_nh", "dgr_ch", "dgr_kh"],
};

export const C5_DGR_02_SEED: SkillSeed = {
  identity: C5_DGR_02_IDENTITY,
  dataset: C5_DGR_02_DATASET,
  levels: [
    {
      code: "GL-C5-DGR-INTRO-0002",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.DGR.02"],
    },
    {
      code: "GL-C5-DGR-TAP-0006",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-DROP-0001",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
