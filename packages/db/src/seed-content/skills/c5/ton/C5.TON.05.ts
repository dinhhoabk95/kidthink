import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_TON_05_IDENTITY: SkillIdentity = {
  code: "C5.TON.05",
  strand_code: "C5.TON",
  competency_code: "C5",
  name: "Nhận dấu thanh trên chữ",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["observe", "match"],
  tier: "advanced",
  prerequisites: ["C5.TON.03", "C5.ALP.04"],
  learning_objectives: [
    {
      code: "LO-C5.TON.05-01",
      behaviour: "Nhận biết và thực hành Nhận dấu thanh trên chữ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.TON.05-02",
      behaviour: "Vận dụng Nhận dấu thanh trên chữ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.TON.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhận dấu thanh trên chữ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_TON_05_DATASET: SkillDataset = {
  skill_code: "C5.TON.05",
  concept_label: "Nhận dấu thanh trên chữ",
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
      description: "Làm quen cơ bản với Nhận dấu thanh trên chữ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận dấu thanh trên chữ",
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
      "Chúng mình cùng tìm hiểu về Nhận dấu thanh trên chữ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_â", "let_b", "let_c", "let_d", "let_đ"],
};

export const C5_TON_05_SEED: SkillSeed = {
  identity: C5_TON_05_IDENTITY,
  dataset: C5_TON_05_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
  ],
};
