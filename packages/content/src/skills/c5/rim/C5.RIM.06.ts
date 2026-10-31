import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RIM_06_IDENTITY: SkillIdentity = {
  code: "C5.RIM.06",
  strand_code: "C5.RIM",
  competency_code: "C5",
  name: "Vần nguyên âm đôi: ia iê ua uô ưa ươ",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["observe", "deduce"],
  tier: "advanced",
  prerequisites: ["C5.RIM.04"],
  learning_objectives: [
    {
      code: "LO-C5.RIM.06-01",
      behaviour:
        "Nhận biết và thực hành Vần nguyên âm đôi: ia iê ua uô ưa ươ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RIM.06-02",
      behaviour:
        "Phân biệt và so sánh Vần nguyên âm đôi: ia iê ua uô ưa ươ trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RIM.06-03",
      behaviour: "Vận dụng và ghi nhớ Vần nguyên âm đôi: ia iê ua uô ưa ươ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RIM_06_DATASET: SkillDataset = {
  skill_code: "C5.RIM.06",
  concept_label: "Vần nguyên âm đôi: ia iê ua uô ưa ươ",
  surface: "game",
  items: [
    {
      id: "rim_ia",
      label: "vần ia (cái thìa)",
      glyph: "ia",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      value: 1,
      category: {
        type: "vần ia ua",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_ua",
      label: "vần ua (con cua)",
      glyph: "ua",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      value: 2,
      category: {
        type: "vần ia ua",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_ưa",
      label: "vần ưa (dưa hấu)",
      glyph: "ưa",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      value: 3,
      category: {
        type: "vần ia ua",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_iê",
      label: "vần iê (con kiến)",
      glyph: "iê",
      image: {
        kind: "emoji",
        ref: "🐜",
      },
      value: 4,
      category: {
        type: "vần iê uô",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_uô",
      label: "vần uô (quả chuối)",
      glyph: "uô",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      value: 5,
      category: {
        type: "vần iê uô",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ươ",
      label: "vần ươ (con bướm)",
      glyph: "ươ",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      value: 6,
      category: {
        type: "vần iê uô",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vần nguyên âm đôi: ia iê ua uô ưa ươ",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Vần nguyên âm đôi: ia iê ua uô ưa ươ",
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
      "Chúng mình cùng tìm hiểu về Vần nguyên âm đôi: ia iê ua uô ưa ươ nhé",
  },
  ordering: ["rim_ia", "rim_ua", "rim_ưa", "rim_iê", "rim_uô", "rim_ươ"],
  axes: {
    category: {
      values: ["vần ia ua", "vần iê uô"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rim_ia",
      target_id: "rim_ua",
    },
    {
      type: "pair",
      source_id: "rim_iê",
      target_id: "rim_uô",
    },
    {
      type: "contrast",
      source_id: "rim_ia",
      target_id: "rim_iê",
    },
  ],
};

export const C5_RIM_06_SEED: SkillSeed = {
  identity: C5_RIM_06_IDENTITY,
  dataset: C5_RIM_06_DATASET,
  levels: [
    {
      code: "GL-C5-RIM-INTRO-0006",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "ocean",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.RIM.06"],
    },
    {
      code: "GL-C5-RIM-TAP-0026",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0028",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0026",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
