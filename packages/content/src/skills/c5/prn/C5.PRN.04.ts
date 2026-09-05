import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRN_04_IDENTITY: SkillIdentity = {
  code: "C5.PRN.04",
  strand_code: "C5.PRN",
  competency_code: "C5",
  name: "Khoảng cách giữa các từ",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "count"],
  tier: "core",
  prerequisites: ["C5.PRN.03"],
  learning_objectives: [
    {
      code: "LO-C5.PRN.04-01",
      behaviour: "Nhận biết và thực hành Khoảng cách giữa các từ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRN.04-02",
      behaviour: "Vận dụng Khoảng cách giữa các từ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRN.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Khoảng cách giữa các từ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRN_04_DATASET: SkillDataset = {
  skill_code: "C5.PRN.04",
  concept_label: "Khoảng cách giữa các từ",
  surface: "game",
  items: [
    {
      id: "let_a",
      label: "chữ a",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ă",
      label: "chữ ă",
      glyph: "ă",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_â",
      label: "chữ â",
      glyph: "â",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_b",
      label: "chữ b",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🅱️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_c",
      label: "chữ c",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🅲",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Khoảng cách giữa các từ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Khoảng cách giữa các từ",
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
      "Chúng mình cùng tìm hiểu về Khoảng cách giữa các từ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_a", "let_ă", "let_â", "let_b", "let_c"],
};

export const C5_PRN_04_SEED: SkillSeed = {
  identity: C5_PRN_04_IDENTITY,
  dataset: C5_PRN_04_DATASET,
  levels: [
    {
      code: "GL-C5-PRN-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0008",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCMP-0007",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCMP-0008",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PAIR-0007",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PAIR-0008",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PATT-0007",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PATT-0008",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
  ],
};
