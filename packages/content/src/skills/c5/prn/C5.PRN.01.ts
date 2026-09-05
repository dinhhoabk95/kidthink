import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRN_01_IDENTITY: SkillIdentity = {
  code: "C5.PRN.01",
  strand_code: "C5.PRN",
  competency_code: "C5",
  name: "Chữ mang nghĩa",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["infer", "observe"],
  tier: "basic",
  prerequisites: ["C5.ALP.01"],
  learning_objectives: [
    {
      code: "LO-C5.PRN.01-01",
      behaviour: "Nhận biết và thực hành Chữ mang nghĩa ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRN.01-02",
      behaviour: "Vận dụng Chữ mang nghĩa trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRN.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chữ mang nghĩa",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRN_01_DATASET: SkillDataset = {
  skill_code: "C5.PRN.01",
  concept_label: "Chữ mang nghĩa",
  surface: "game",
  items: [
    {
      id: "let_r",
      label: "chữ r",
      glyph: "r",
      image: {
        kind: "emoji",
        ref: "🆁",
      },
      contrast_group: "primary",
    },
    {
      id: "let_s",
      label: "chữ s",
      glyph: "s",
      image: {
        kind: "emoji",
        ref: "🆂",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_t",
      label: "chữ t",
      glyph: "t",
      image: {
        kind: "emoji",
        ref: "🆃",
      },
      contrast_group: "primary",
    },
    {
      id: "let_u",
      label: "chữ u",
      glyph: "u",
      image: {
        kind: "emoji",
        ref: "🆄",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_ư",
      label: "chữ ư",
      glyph: "ư",
      image: {
        kind: "emoji",
        ref: "🆄",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ mang nghĩa",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ mang nghĩa",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chữ mang nghĩa nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_r", "let_s", "let_t", "let_u", "let_ư"],
};

export const C5_PRN_01_SEED: SkillSeed = {
  identity: C5_PRN_01_IDENTITY,
  dataset: C5_PRN_01_DATASET,
  levels: [
    {
      code: "GL-C5-PRN-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
  ],
};
