import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_07_IDENTITY: SkillIdentity = {
  code: "C5.RHY.07",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Vần có nguyên âm đôi: ia · ua · ưa",
  age_min: 6,
  age_max: 7,
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
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_đ", "let_e", "let_ê", "let_g", "let_h"],
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
    {
      code: "GL-C5-RHY-TCNT-0008",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PAIR-0007",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PAIR-0008",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PATT-0013",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PATT-0014",
      template: "GT-005",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
  ],
};
