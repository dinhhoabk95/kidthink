import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRN_02_IDENTITY: SkillIdentity = {
  code: "C5.PRN.02",
  strand_code: "C5.PRN",
  competency_code: "C5",
  name: "Chữ ở quanh ta: biển hiệu · nhãn",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: ["C5.PRN.01"],
  learning_objectives: [
    {
      code: "LO-C5.PRN.02-01",
      behaviour:
        "Nhận biết và thực hành Chữ ở quanh ta: biển hiệu · nhãn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRN.02-02",
      behaviour:
        "Vận dụng Chữ ở quanh ta: biển hiệu · nhãn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRN.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chữ ở quanh ta: biển hiệu · nhãn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRN_02_DATASET: SkillDataset = {
  skill_code: "C5.PRN.02",
  concept_label: "Chữ ở quanh ta: biển hiệu · nhãn",
  surface: "game",
  items: [
    {
      id: "let_s",
      label: "chữ s",
      glyph: "s",
      image: {
        kind: "emoji",
        ref: "🆂",
      },
      contrast_group: "primary",
    },
    {
      id: "let_t",
      label: "chữ t",
      glyph: "t",
      image: {
        kind: "emoji",
        ref: "🆃",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_u",
      label: "chữ u",
      glyph: "u",
      image: {
        kind: "emoji",
        ref: "🆄",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ư",
      label: "chữ ư",
      glyph: "ư",
      image: {
        kind: "emoji",
        ref: "🆄",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_v",
      label: "chữ v",
      glyph: "v",
      image: {
        kind: "emoji",
        ref: "🆅",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ ở quanh ta: biển hiệu · nhãn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ ở quanh ta: biển hiệu · nhãn",
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
      "Chúng mình cùng tìm hiểu về Chữ ở quanh ta: biển hiệu · nhãn nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_s", "let_t", "let_u", "let_ư", "let_v"],
};

export const C5_PRN_02_SEED: SkillSeed = {
  identity: C5_PRN_02_IDENTITY,
  dataset: C5_PRN_02_DATASET,
  levels: [
    {
      code: "GL-C5-PRN-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PATT-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-PATT-0004",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
  ],
};
