import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_05_IDENTITY: SkillIdentity = {
  code: "C5.ALP.05",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Chữ hoa – chữ thường",
  age_min: 6,
  age_max: 7,
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
      id: "let_đ",
      label: "chữ đ",
      glyph: "đ",
      image: {
        kind: "emoji",
        ref: "🅳",
      },
      contrast_group: "primary",
    },
    {
      id: "let_e",
      label: "chữ e",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_ê",
      label: "chữ ê",
      glyph: "ê",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "primary",
    },
    {
      id: "let_g",
      label: "chữ g",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "🅶",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_h",
      label: "chữ h",
      glyph: "h",
      image: {
        kind: "emoji",
        ref: "🅷",
      },
      contrast_group: "primary",
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
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_đ", "let_e", "let_ê", "let_g", "let_h"],
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
      code: "GL-C5-ALP-TCNT-0009",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCNT-0010",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
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
    {
      code: "GL-C5-ALP-TCMP-0010",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PAIR-0009",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PAIR-0010",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PATT-0009",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PATT-0010",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
  ],
};
