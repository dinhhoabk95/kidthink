import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_03_IDENTITY: SkillIdentity = {
  code: "C5.PHO.03",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Tiếng dài – tiếng ngắn",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "compare"],
  tier: "core",
  prerequisites: ["C5.PHO.01"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.03-01",
      behaviour: "Nhận biết và thực hành Tiếng dài – tiếng ngắn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.03-02",
      behaviour: "Vận dụng Tiếng dài – tiếng ngắn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tiếng dài – tiếng ngắn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_03_DATASET: SkillDataset = {
  skill_code: "C5.PHO.03",
  concept_label: "Tiếng dài – tiếng ngắn",
  surface: "game",
  items: [
    {
      id: "let_m",
      label: "chữ m",
      glyph: "m",
      image: {
        kind: "emoji",
        ref: "🅼",
      },
      contrast_group: "primary",
    },
    {
      id: "let_n",
      label: "chữ n",
      glyph: "n",
      image: {
        kind: "emoji",
        ref: "🅽",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_o",
      label: "chữ o",
      glyph: "o",
      image: {
        kind: "emoji",
        ref: "🅾️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ô",
      label: "chữ ô",
      glyph: "ô",
      image: {
        kind: "emoji",
        ref: "🅾️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_ơ",
      label: "chữ ơ",
      glyph: "ơ",
      image: {
        kind: "emoji",
        ref: "🅾️",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tiếng dài – tiếng ngắn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tiếng dài – tiếng ngắn",
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
      "Chúng mình cùng tìm hiểu về Tiếng dài – tiếng ngắn nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_m", "let_n", "let_o", "let_ô", "let_ơ"],
};

export const C5_PHO_03_SEED: SkillSeed = {
  identity: C5_PHO_03_IDENTITY,
  dataset: C5_PHO_03_DATASET,
  levels: [
    {
      code: "GL-C5-PHO-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
