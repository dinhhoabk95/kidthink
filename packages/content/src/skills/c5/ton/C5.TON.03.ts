import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_TON_03_IDENTITY: SkillIdentity = {
  code: "C5.TON.03",
  strand_code: "C5.TON",
  competency_code: "C5",
  name: "Thanh sắc và thanh nặng",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "match"],
  tier: "advanced",
  prerequisites: ["C5.TON.02"],
  learning_objectives: [
    {
      code: "LO-C5.TON.03-01",
      behaviour: "Nhận biết và thực hành Thanh sắc và thanh nặng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.TON.03-02",
      behaviour: "Vận dụng Thanh sắc và thanh nặng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.TON.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thanh sắc và thanh nặng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_TON_03_DATASET: SkillDataset = {
  skill_code: "C5.TON.03",
  concept_label: "Thanh sắc và thanh nặng",
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
      description: "Làm quen cơ bản với Thanh sắc và thanh nặng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thanh sắc và thanh nặng",
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
      "Chúng mình cùng tìm hiểu về Thanh sắc và thanh nặng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_a", "let_ă", "let_â", "let_b", "let_c"],
};

export const C5_TON_03_SEED: SkillSeed = {
  identity: C5_TON_03_IDENTITY,
  dataset: C5_TON_03_DATASET,
  levels: [
    {
      code: "GL-C5-TON-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-TCMP-0003",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-TCMP-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PATT-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PATT-0006",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-SLOT-0003",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PUZZ-0003",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PUZZ-0004",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
  ],
};
