import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_03_IDENTITY: SkillIdentity = {
  code: "C5.ALP.03",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "match"],
  tier: "core",
  prerequisites: ["C5.ALP.01", "C5.LET.02"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.03-01",
      behaviour:
        "Nhận biết và thực hành Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.03-02",
      behaviour:
        "Vận dụng Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_03_DATASET: SkillDataset = {
  skill_code: "C5.ALP.03",
  concept_label: "Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y",
  surface: "game",
  items: [
    {
      id: "let_a",
      label: "chữ a (con cá)",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "nguyên âm đơn",
        label: "Nguyên âm đơn",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "let_ă",
      label: "chữ ă (cái khăn)",
      glyph: "ă",
      image: {
        kind: "emoji",
        ref: "🧣",
      },
      category: {
        type: "chữ có dấu phụ",
        label: "Nguyên âm có dấu mũ móc",
      },
      contrast_group: "contrast",
      value: 2,
      ordering: 2,
    },
    {
      id: "let_â",
      label: "chữ â (đám mây)",
      glyph: "â",
      image: {
        kind: "emoji",
        ref: "☁️",
      },
      category: {
        type: "chữ có dấu phụ",
        label: "Nguyên âm có dấu mũ móc",
      },
      contrast_group: "contrast",
      value: 3,
      ordering: 3,
    },
    {
      id: "let_e",
      label: "chữ e (em bé)",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "👶",
      },
      category: {
        type: "nguyên âm đơn",
        label: "Nguyên âm đơn",
      },
      contrast_group: "primary",
      value: 4,
      ordering: 4,
    },
    {
      id: "let_ê",
      label: "chữ ê (chú ếch)",
      glyph: "ê",
      image: {
        kind: "emoji",
        ref: "🐸",
      },
      category: {
        type: "chữ có dấu phụ",
        label: "Nguyên âm có dấu mũ móc",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "let_o",
      label: "chữ o (con ong)",
      glyph: "o",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "nguyên âm đơn",
        label: "Nguyên âm đơn",
      },
      contrast_group: "primary",
      value: 6,
      ordering: 6,
    },
    {
      id: "let_ô",
      label: "chữ ô (cái ô)",
      glyph: "ô",
      image: {
        kind: "emoji",
        ref: "☂️",
      },
      category: {
        type: "chữ có dấu phụ",
        label: "Nguyên âm có dấu mũ móc",
      },
      contrast_group: "contrast",
      value: 7,
      ordering: 7,
    },
    {
      id: "let_u",
      label: "chữ u (chim cú)",
      glyph: "u",
      image: {
        kind: "emoji",
        ref: "🦉",
      },
      category: {
        type: "nguyên âm đơn",
        label: "Nguyên âm đơn",
      },
      contrast_group: "primary",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "let_a",
      target_id: "let_e",
      explanation: "chữ a và chữ e đều là nguyên âm đơn",
    },
    {
      type: "pair",
      source_id: "let_ă",
      target_id: "let_â",
      explanation: "chữ ă và chữ â đều là nguyên âm có dấu phụ",
    },
    {
      type: "contrast",
      source_id: "let_a",
      target_id: "let_ă",
      explanation: "nguyên âm đơn đối lập với nguyên âm có dấu phụ",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description:
        "Làm quen cơ bản với Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y",
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
      "Chúng mình cùng tìm hiểu về Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y nhé",
  },
  ordering: [
    "let_a",
    "let_ă",
    "let_â",
    "let_e",
    "let_ê",
    "let_o",
    "let_ô",
    "let_u",
  ],
};

export const C5_ALP_03_SEED: SkillSeed = {
  identity: C5_ALP_03_IDENTITY,
  dataset: C5_ALP_03_DATASET,
  levels: [
    {
      code: "GL-C5-ALP-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PATT-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
