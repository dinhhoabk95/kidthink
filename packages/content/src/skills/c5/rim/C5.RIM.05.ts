import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RIM_05_IDENTITY: SkillIdentity = {
  code: "C5.RIM.05",
  strand_code: "C5.RIM",
  competency_code: "C5",
  name: "Vần có âm đệm: oa oe uy uê uơ",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["observe", "compare"],
  tier: "advanced",
  prerequisites: ["C5.RIM.01"],
  learning_objectives: [
    {
      code: "LO-C5.RIM.05-01",
      behaviour:
        "Nhận biết và thực hành Vần có âm đệm: oa oe uy uê uơ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RIM.05-02",
      behaviour:
        "Phân biệt và so sánh Vần có âm đệm: oa oe uy uê uơ trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RIM.05-03",
      behaviour: "Vận dụng và ghi nhớ Vần có âm đệm: oa oe uy uê uơ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RIM_05_DATASET: SkillDataset = {
  skill_code: "C5.RIM.05",
  concept_label: "Vần có âm đệm: oa oe uy uê uơ",
  surface: "game",
  items: [
    {
      id: "rim_oa",
      label: "vần oa",
      glyph: "oa",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_oe",
      label: "vần oe",
      glyph: "oe",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_uy",
      label: "vần uy",
      glyph: "uy",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_uê",
      label: "vần uê",
      glyph: "uê",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_uơ",
      label: "vần uơ",
      glyph: "uơ",
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
      description: "Làm quen cơ bản với Vần có âm đệm: oa oe uy uê uơ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vần có âm đệm: oa oe uy uê uơ",
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
      "Chúng mình cùng tìm hiểu về Vần có âm đệm: oa oe uy uê uơ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["rim_oa", "rim_oe", "rim_uy", "rim_uê", "rim_uơ"],
};

export const C5_RIM_05_SEED: SkillSeed = {
  identity: C5_RIM_05_IDENTITY,
  dataset: C5_RIM_05_DATASET,
  levels: [
    {
      code: "GL-C5-RIM-INTRO-0005",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "nature",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.RIM.05"],
    },
    {
      code: "GL-C5-RIM-TAP-0021",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0022",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0023",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0024",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0025",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0021",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0022",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0023",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0024",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0025",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "weather",
      rounds: 3,
    },
  ],
};
