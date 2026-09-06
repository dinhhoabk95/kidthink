import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ONS_01_IDENTITY: SkillIdentity = {
  code: "C5.ONS.01",
  strand_code: "C5.ONS",
  competency_code: "C5",
  name: "Tách tiếng ra âm đầu và vần",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["listen", "deduce"],
  tier: "core",
  prerequisites: ["C5.PHO.02"],
  learning_objectives: [
    {
      code: "LO-C5.ONS.01-01",
      behaviour:
        "Nhận biết và thực hành Tách tiếng ra âm đầu và vần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ONS.01-02",
      behaviour:
        "Phân biệt và so sánh Tách tiếng ra âm đầu và vần trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ONS.01-03",
      behaviour: "Vận dụng và ghi nhớ Tách tiếng ra âm đầu và vần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ONS_01_DATASET: SkillDataset = {
  skill_code: "C5.ONS.01",
  concept_label: "Tách tiếng ra âm đầu và vần",
  surface: "game",
  items: [
    {
      id: "ons_part_dau",
      label: "âm đầu",
      glyph: "âm đầu",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_part_van",
      label: "vần",
      glyph: "vần",
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
      description: "Làm quen cơ bản với Tách tiếng ra âm đầu và vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tách tiếng ra âm đầu và vần",
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
      "Chúng mình cùng tìm hiểu về Tách tiếng ra âm đầu và vần nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["ons_part_dau", "ons_part_van"],
};

export const C5_ONS_01_SEED: SkillSeed = {
  identity: C5_ONS_01_IDENTITY,
  dataset: C5_ONS_01_DATASET,
  levels: [
    {
      code: "GL-C5-ONS-INTRO-0001",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.ONS.01"],
    },
    {
      code: "GL-C5-ONS-TAP-0001",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-TAP-0002",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-TAP-0003",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-TAP-0004",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-TAP-0005",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-PAIR-0001",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-PAIR-0002",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-PAIR-0003",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-PAIR-0004",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-PAIR-0005",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
