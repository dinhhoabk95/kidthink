import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_LET_02_IDENTITY: SkillIdentity = {
  code: "C5.LET.02",
  strand_code: "C5.LET",
  competency_code: "C5",
  name: "Nhận biết ă · â · ê · ô · ơ · ư",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "compare"],
  tier: "basic",
  prerequisites: ["C5.LET.01"],
  learning_objectives: [
    {
      code: "LO-C5.LET.02-01",
      behaviour:
        "Nhận biết và thực hành Nhận biết ă · â · ê · ô · ơ · ư ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.LET.02-02",
      behaviour:
        "Phân biệt và so sánh Nhận biết ă · â · ê · ô · ơ · ư trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.LET.02-03",
      behaviour: "Vận dụng và ghi nhớ Nhận biết ă · â · ê · ô · ơ · ư",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_LET_02_DATASET: SkillDataset = {
  skill_code: "C5.LET.02",
  concept_label: "Nhận biết ă · â · ê · ô · ơ · ư",
  surface: "game",
  items: [
    {
      id: "let_ă",
      label: "chữ ă",
      glyph: "ă",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_â",
      label: "chữ â",
      glyph: "â",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_ê",
      label: "chữ ê",
      glyph: "ê",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_ô",
      label: "chữ ô",
      glyph: "ô",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_ơ",
      label: "chữ ơ",
      glyph: "ơ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_ư",
      label: "chữ ư",
      glyph: "ư",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhận biết ă · â · ê · ô · ơ · ư",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận biết ă · â · ê · ô · ơ · ư",
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
      "Chúng mình cùng tìm hiểu về Nhận biết ă · â · ê · ô · ơ · ư nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["let_ă", "let_â", "let_ê", "let_ô", "let_ơ", "let_ư"],
};

export const C5_LET_02_SEED: SkillSeed = {
  identity: C5_LET_02_IDENTITY,
  dataset: C5_LET_02_DATASET,
  levels: [
    {
      code: "GL-C5-LET-INTRO-0002",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.LET.02"],
    },
    {
      code: "GL-C5-LET-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-TAP-0008",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0006",
      template: "GT-002",
      band: "3-4",
      difficulty: 1,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0007",
      template: "GT-002",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0008",
      template: "GT-002",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0010",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
  ],
};
