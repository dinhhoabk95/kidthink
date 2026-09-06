import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_01_IDENTITY: SkillIdentity = {
  code: "C5.ALP.01",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Chữ khác hình, khác số",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["compare", "sort"],
  tier: "basic",
  prerequisites: ["C4.DET.02", "C5.LET.01"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.01-01",
      behaviour: "Nhận biết và thực hành Chữ khác hình, khác số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.01-02",
      behaviour: "Vận dụng Chữ khác hình, khác số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chữ khác hình, khác số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_01_DATASET: SkillDataset = {
  skill_code: "C5.ALP.01",
  concept_label: "Chữ khác hình, khác số",
  surface: "game",
  items: [
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
    {
      id: "let_d",
      label: "chữ d",
      glyph: "d",
      image: {
        kind: "emoji",
        ref: "🅳",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_đ",
      label: "chữ đ",
      glyph: "đ",
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
      description: "Làm quen cơ bản với Chữ khác hình, khác số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ khác hình, khác số",
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
      "Chúng mình cùng tìm hiểu về Chữ khác hình, khác số nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_â", "let_b", "let_c", "let_d", "let_đ"],
};

export const C5_ALP_01_SEED: SkillSeed = {
  identity: C5_ALP_01_IDENTITY,
  dataset: C5_ALP_01_DATASET,
  levels: [
    {
      code: "GL-C5-ALP-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
  ],
};
