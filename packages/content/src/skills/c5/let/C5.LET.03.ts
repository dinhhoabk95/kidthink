import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_LET_03_IDENTITY: SkillIdentity = {
  code: "C5.LET.03",
  strand_code: "C5.LET",
  competency_code: "C5",
  name: "Nhận biết b · c · d · đ · g · h",
  age_min: 5,
  age_max: 5,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "core",
  prerequisites: ["C5.LET.01"],
  learning_objectives: [
    {
      code: "LO-C5.LET.03-01",
      behaviour:
        "Nhận biết và thực hành Nhận biết b · c · d · đ · g · h ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.LET.03-02",
      behaviour:
        "Phân biệt và so sánh Nhận biết b · c · d · đ · g · h trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.LET.03-03",
      behaviour: "Vận dụng và ghi nhớ Nhận biết b · c · d · đ · g · h",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_LET_03_DATASET: SkillDataset = {
  skill_code: "C5.LET.03",
  concept_label: "Nhận biết b · c · d · đ · g · h",
  surface: "game",
  items: [
    {
      id: "let_b",
      label: "chữ b",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_c",
      label: "chữ c",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_d",
      label: "chữ d",
      glyph: "d",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_đ",
      label: "chữ đ",
      glyph: "đ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_g",
      label: "chữ g",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_h",
      label: "chữ h",
      glyph: "h",
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
      description: "Làm quen cơ bản với Nhận biết b · c · d · đ · g · h",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận biết b · c · d · đ · g · h",
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
      "Chúng mình cùng tìm hiểu về Nhận biết b · c · d · đ · g · h nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["let_b", "let_c", "let_d", "let_đ", "let_g", "let_h"],
};

export const C5_LET_03_SEED: SkillSeed = {
  identity: C5_LET_03_IDENTITY,
  dataset: C5_LET_03_DATASET,
  levels: [
    {
      code: "GL-C5-LET-INTRO-0003",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.LET.03"],
    },
    {
      code: "GL-C5-LET-TAP-0011",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-TAP-0012",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-TAP-0013",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-TAP-0014",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-TAP-0015",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0011",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0012",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0013",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0014",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0015",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
