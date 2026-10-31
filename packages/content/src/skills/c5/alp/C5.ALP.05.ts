import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_05_IDENTITY: SkillIdentity = {
  code: "C5.ALP.05",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Chữ hoa – chữ thường",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["match", "compare"],
  tier: "advanced",
  prerequisites: ["C5.ALP.04"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.05-01",
      behaviour: "Nhận biết và thực hành Chữ hoa – chữ thường ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.05-02",
      behaviour: "Vận dụng Chữ hoa – chữ thường trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chữ hoa – chữ thường",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_05_DATASET: SkillDataset = {
  skill_code: "C5.ALP.05",
  concept_label: "Chữ hoa – chữ thường",
  surface: "game",
  items: [
    {
      id: "let_a_hoa",
      label: "chữ A in hoa",
      glyph: "A",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      category: {
        type: "chữ in hoa",
        label: "Chữ in hoa",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "let_b_hoa",
      label: "chữ B in hoa",
      glyph: "B",
      image: {
        kind: "emoji",
        ref: "🅱️",
      },
      category: {
        type: "chữ in hoa",
        label: "Chữ in hoa",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "let_c_hoa",
      label: "chữ C in hoa",
      glyph: "C",
      image: {
        kind: "emoji",
        ref: "🔤",
      },
      category: {
        type: "chữ in hoa",
        label: "Chữ in hoa",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "let_a_thuong",
      label: "chữ a in thường",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "chữ in thường",
        label: "Chữ in thường",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "let_b_thuong",
      label: "chữ b in thường",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "chữ in thường",
        label: "Chữ in thường",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "let_c_thuong",
      label: "chữ c in thường",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      category: {
        type: "chữ in thường",
        label: "Chữ in thường",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  axes: {
    category: {
      values: ["chữ in hoa", "chữ in thường"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "let_a_hoa",
      target_id: "let_a_thuong",
      explanation: "chữ A in hoa và chữ a in thường là một cặp",
    },
    {
      type: "pair",
      source_id: "let_b_hoa",
      target_id: "let_b_thuong",
      explanation: "chữ B in hoa và chữ b in thường là một cặp",
    },
    {
      type: "pair",
      source_id: "let_c_hoa",
      target_id: "let_c_thuong",
      explanation: "chữ C in hoa và chữ c in thường là một cặp",
    },
    {
      type: "contrast",
      source_id: "let_a_hoa",
      target_id: "let_a_thuong",
      explanation: "chữ in hoa đối lập với chữ in thường",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ hoa – chữ thường",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ hoa – chữ thường",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chữ hoa – chữ thường nhé",
  },
  ordering: [
    "let_a_hoa",
    "let_b_hoa",
    "let_c_hoa",
    "let_a_thuong",
    "let_b_thuong",
    "let_c_thuong",
  ],
};

export const C5_ALP_05_SEED: SkillSeed = {
  identity: C5_ALP_05_IDENTITY,
  dataset: C5_ALP_05_DATASET,
  levels: [
    {
      code: "GL-C5-ALP-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCMP-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
