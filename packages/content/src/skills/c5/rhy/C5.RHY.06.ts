import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_06_IDENTITY: SkillIdentity = {
  code: "C5.RHY.06",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Vần có âm đệm: oa · oe · uy",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["solve", "observe"],
  tier: "advanced",
  prerequisites: ["C5.RHY.04"],
  learning_objectives: [
    {
      code: "LO-C5.RHY.06-01",
      behaviour:
        "Nhận biết và thực hành Vần có âm đệm: oa · oe · uy ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RHY.06-02",
      behaviour:
        "Vận dụng Vần có âm đệm: oa · oe · uy trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RHY.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Vần có âm đệm: oa · oe · uy",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RHY_06_DATASET: SkillDataset = {
  skill_code: "C5.RHY.06",
  concept_label: "Vần có âm đệm: oa · oe · uy",
  surface: "game",
  items: [
    {
      id: "let_d",
      label: "chữ d",
      glyph: "d",
      image: {
        kind: "emoji",
        ref: "🅳",
      },
      contrast_group: "primary",
    },
    {
      id: "let_đ",
      label: "chữ đ",
      glyph: "đ",
      image: {
        kind: "emoji",
        ref: "🅳",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_e",
      label: "chữ e",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ê",
      label: "chữ ê",
      glyph: "ê",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_g",
      label: "chữ g",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "🅶",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vần có âm đệm: oa · oe · uy",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vần có âm đệm: oa · oe · uy",
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
      "Chúng mình cùng tìm hiểu về Vần có âm đệm: oa · oe · uy nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_d", "let_đ", "let_e", "let_ê", "let_g"],
};

export const C5_RHY_06_SEED: SkillSeed = {
  identity: C5_RHY_06_IDENTITY,
  dataset: C5_RHY_06_DATASET,
  levels: [
    {
      code: "GL-C5-RHY-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TCNT-0005",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TCNT-0006",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TCMP-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TCMP-0010",
      template: "GT-003",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PAIR-0005",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PAIR-0006",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PATT-0011",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PATT-0012",
      template: "GT-005",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
  ],
};
