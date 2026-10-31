import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_06_IDENTITY: SkillIdentity = {
  code: "C5.ALP.06",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Âm của chữ",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["listen", "match"],
  tier: "advanced",
  prerequisites: ["C5.ALP.04", "C5.PHO.04"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.06-01",
      behaviour: "Nhận biết và thực hành Âm của chữ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.06-02",
      behaviour: "Vận dụng Âm của chữ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Âm của chữ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_06_DATASET: SkillDataset = {
  skill_code: "C5.ALP.06",
  concept_label: "Âm của chữ",
  surface: "game",
  items: [
    {
      id: "let_a",
      label: "chữ a (âm a)",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "âm nguyên âm",
        label: "Âm nguyên âm",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "let_o",
      label: "chữ o (âm o)",
      glyph: "o",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "âm nguyên âm",
        label: "Âm nguyên âm",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "let_e",
      label: "chữ e (âm e)",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "👶",
      },
      category: {
        type: "âm nguyên âm",
        label: "Âm nguyên âm",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "let_b",
      label: "chữ b (âm bờ)",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "âm phụ âm",
        label: "Âm phụ âm",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "let_c",
      label: "chữ c (âm cờ)",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      category: {
        type: "âm phụ âm",
        label: "Âm phụ âm",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "let_d",
      label: "chữ d (âm dờ)",
      glyph: "d",
      image: {
        kind: "emoji",
        ref: "🐐",
      },
      category: {
        type: "âm phụ âm",
        label: "Âm phụ âm",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "let_a",
      target_id: "let_o",
      explanation: "chữ a và chữ o đều phát ra âm nguyên âm",
    },
    {
      type: "pair",
      source_id: "let_b",
      target_id: "let_c",
      explanation: "chữ b và chữ c đều phát ra âm phụ âm",
    },
    {
      type: "contrast",
      source_id: "let_a",
      target_id: "let_b",
      explanation: "âm nguyên âm đối lập với âm phụ âm",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Âm của chữ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Âm của chữ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Âm của chữ nhé",
  },
  ordering: ["let_a", "let_o", "let_e", "let_b", "let_c", "let_d"],
};

export const C5_ALP_06_SEED: SkillSeed = {
  identity: C5_ALP_06_IDENTITY,
  dataset: C5_ALP_06_DATASET,
  levels: [
    {
      code: "GL-C5-ALP-TAP-0012",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-SLOT-0001",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PUZZ-0001",
      template: "GT-010",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
