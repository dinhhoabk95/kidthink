import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRN_05_IDENTITY: SkillIdentity = {
  code: "C5.PRN.05",
  strand_code: "C5.PRN",
  competency_code: "C5",
  name: "Dấu chấm, dấu hỏi",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["observe", "infer"],
  tier: "advanced",
  prerequisites: ["C5.PRN.04", "C5.GRM.04"],
  learning_objectives: [
    {
      code: "LO-C5.PRN.05-01",
      behaviour: "Nhận biết và thực hành Dấu chấm, dấu hỏi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRN.05-02",
      behaviour: "Vận dụng Dấu chấm, dấu hỏi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRN.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Dấu chấm, dấu hỏi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRN_05_DATASET: SkillDataset = {
  skill_code: "C5.PRN.05",
  concept_label: "Dấu chấm, dấu hỏi",
  surface: "game",
  items: [
    {
      id: "let_ă",
      label: "chữ ă",
      glyph: "ă",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_â",
      label: "chữ â",
      glyph: "â",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_b",
      label: "chữ b",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🅱️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_c",
      label: "chữ c",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🅲",
      },
      contrast_group: "contrast",
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Dấu chấm, dấu hỏi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dấu chấm, dấu hỏi",
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
    narration_template: "Chúng mình cùng tìm hiểu về Dấu chấm, dấu hỏi nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_ă", "let_â", "let_b", "let_c", "let_d"],
};

export const C5_PRN_05_SEED: SkillSeed = {
  identity: C5_PRN_05_IDENTITY,
  dataset: C5_PRN_05_DATASET,
  levels: [
    {
      code: "GL-C5-PRN-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0009",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0010",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCMP-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCMP-0010",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PAIR-0009",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PAIR-0010",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PATT-0009",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PATT-0010",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
  ],
};
