import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_04_IDENTITY: SkillIdentity = {
  code: "C5.ALP.04",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Nhận đủ 29 chữ cái",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["observe", "recall"],
  tier: "advanced",
  prerequisites: ["C5.ALP.03", "C5.LET.05"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.04-01",
      behaviour: "Nhận biết và thực hành Nhận đủ 29 chữ cái ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.04-02",
      behaviour: "Vận dụng Nhận đủ 29 chữ cái trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhận đủ 29 chữ cái",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_04_DATASET: SkillDataset = {
  skill_code: "C5.ALP.04",
  concept_label: "Nhận đủ 29 chữ cái",
  surface: "game",
  items: [
    {
      id: "let_b",
      label: "chữ b (con bướm)",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "chữ cái nhóm 1",
        label: "Nhóm chữ b d đ m",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "let_d",
      label: "chữ d (con dê)",
      glyph: "d",
      image: {
        kind: "emoji",
        ref: "🐐",
      },
      category: {
        type: "chữ cái nhóm 1",
        label: "Nhóm chữ b d đ m",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "let_đ",
      label: "chữ đ (quả đào)",
      glyph: "đ",
      image: {
        kind: "emoji",
        ref: "🍑",
      },
      category: {
        type: "chữ cái nhóm 1",
        label: "Nhóm chữ b d đ m",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "let_m",
      label: "chữ m (con mèo)",
      glyph: "m",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "chữ cái nhóm 1",
        label: "Nhóm chữ b d đ m",
      },
      contrast_group: "primary",
      value: 4,
      ordering: 4,
    },
    {
      id: "let_c",
      label: "chữ c (con cua)",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      category: {
        type: "chữ cái nhóm 2",
        label: "Nhóm chữ c g h l",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "let_g",
      label: "chữ g (con gà)",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "chữ cái nhóm 2",
        label: "Nhóm chữ c g h l",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
    {
      id: "let_h",
      label: "chữ h (bông hoa)",
      glyph: "h",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "chữ cái nhóm 2",
        label: "Nhóm chữ c g h l",
      },
      contrast_group: "contrast",
      value: 7,
      ordering: 7,
    },
    {
      id: "let_l",
      label: "chữ l (chiếc lá)",
      glyph: "l",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "chữ cái nhóm 2",
        label: "Nhóm chữ c g h l",
      },
      contrast_group: "contrast",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "let_b",
      target_id: "let_d",
      explanation: "cùng thuộc nhóm chữ cái một",
    },
    {
      type: "pair",
      source_id: "let_c",
      target_id: "let_g",
      explanation: "cùng thuộc nhóm chữ cái hai",
    },
    {
      type: "contrast",
      source_id: "let_b",
      target_id: "let_c",
      explanation: "khác nhóm chữ cái",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhận đủ 29 chữ cái",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận đủ 29 chữ cái",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhận đủ 29 chữ cái nhé",
  },
  ordering: [
    "let_b",
    "let_d",
    "let_đ",
    "let_m",
    "let_c",
    "let_g",
    "let_h",
    "let_l",
  ],
};

export const C5_ALP_04_SEED: SkillSeed = {
  identity: C5_ALP_04_IDENTITY,
  dataset: C5_ALP_04_DATASET,
  levels: [
    {
      code: "GL-C5-ALP-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PAIR-0007",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PATT-0007",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
