import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RIM_01_IDENTITY: SkillIdentity = {
  code: "C5.RIM.01",
  strand_code: "C5.RIM",
  competency_code: "C5",
  name: "Vần một âm: 12 nguyên âm",
  age_min: 5,
  age_max: 5,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "core",
  prerequisites: ["C5.LET.02"],
  learning_objectives: [
    {
      code: "LO-C5.RIM.01-01",
      behaviour: "Nhận biết và thực hành Vần một âm: 12 nguyên âm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RIM.01-02",
      behaviour:
        "Phân biệt và so sánh Vần một âm: 12 nguyên âm trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RIM.01-03",
      behaviour: "Vận dụng và ghi nhớ Vần một âm: 12 nguyên âm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RIM_01_DATASET: SkillDataset = {
  skill_code: "C5.RIM.01",
  concept_label: "Vần một âm: 12 nguyên âm",
  surface: "game",
  items: [
    {
      id: "rim_a",
      label: "vần a",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ă",
      label: "vần ă",
      glyph: "ă",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_â",
      label: "vần â",
      glyph: "â",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_e",
      label: "vần e",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ê",
      label: "vần ê",
      glyph: "ê",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_i",
      label: "vần i",
      glyph: "i",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_o",
      label: "vần o",
      glyph: "o",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ô",
      label: "vần ô",
      glyph: "ô",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ơ",
      label: "vần ơ",
      glyph: "ơ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_u",
      label: "vần u",
      glyph: "u",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ư",
      label: "vần ư",
      glyph: "ư",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_y",
      label: "vần y",
      glyph: "y",
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
      description: "Làm quen cơ bản với Vần một âm: 12 nguyên âm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vần một âm: 12 nguyên âm",
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
      "Chúng mình cùng tìm hiểu về Vần một âm: 12 nguyên âm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "rim_a",
    "rim_ă",
    "rim_â",
    "rim_e",
    "rim_ê",
    "rim_i",
    "rim_o",
    "rim_ô",
    "rim_ơ",
    "rim_u",
    "rim_ư",
    "rim_y",
  ],
};

export const C5_RIM_01_SEED: SkillSeed = {
  identity: C5_RIM_01_IDENTITY,
  dataset: C5_RIM_01_DATASET,
  levels: [
    {
      code: "GL-C5-RIM-INTRO-0001",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.RIM.01"],
    },
    {
      code: "GL-C5-RIM-TAP-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0003",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0004",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
