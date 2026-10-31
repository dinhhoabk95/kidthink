import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_TON_04_IDENTITY: SkillIdentity = {
  code: "C5.TON.04",
  strand_code: "C5.TON",
  competency_code: "C5",
  name: "Thanh hỏi và thanh ngã",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["listen", "compare"],
  tier: "advanced",
  prerequisites: ["C5.TON.03"],
  learning_objectives: [
    {
      code: "LO-C5.TON.04-01",
      behaviour: "Nhận biết và thực hành Thanh hỏi và thanh ngã ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.TON.04-02",
      behaviour: "Vận dụng Thanh hỏi và thanh ngã trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.TON.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thanh hỏi và thanh ngã",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_TON_04_DATASET: SkillDataset = {
  skill_code: "C5.TON.04",
  concept_label: "Thanh hỏi và thanh ngã",
  surface: "game",
  items: [
    {
      id: "ton_tho_hoi",
      label: "tiếng thỏ",
      glyph: "thỏ",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "tiếng thanh hỏi",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "ton_co_hoi",
      label: "tiếng cỏ",
      glyph: "cỏ",
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      category: {
        type: "tiếng thanh hỏi",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "ton_ho_hoi",
      label: "tiếng hổ",
      glyph: "hổ",
      image: {
        kind: "emoji",
        ref: "🐯",
      },
      category: {
        type: "tiếng thanh hỏi",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "ton_sua_nga",
      label: "tiếng sữa",
      glyph: "sữa",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "tiếng thanh ngã",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "ton_mu_nga",
      label: "tiếng mũ",
      glyph: "mũ",
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      category: {
        type: "tiếng thanh ngã",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "ton_go_nga",
      label: "tiếng gỗ",
      glyph: "gỗ",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "tiếng thanh ngã",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["tiếng thanh hỏi", "tiếng thanh ngã"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "ton_tho_hoi",
      target_id: "ton_sua_nga",
    },
    {
      type: "pair",
      source_id: "ton_co_hoi",
      target_id: "ton_mu_nga",
    },
    {
      type: "pair",
      source_id: "ton_ho_hoi",
      target_id: "ton_go_nga",
    },
    {
      type: "contrast",
      source_id: "ton_tho_hoi",
      target_id: "ton_sua_nga",
    },
    {
      type: "contrast",
      source_id: "ton_co_hoi",
      target_id: "ton_mu_nga",
    },
    {
      type: "contrast",
      source_id: "ton_ho_hoi",
      target_id: "ton_go_nga",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Thanh hỏi và thanh ngã",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thanh hỏi và thanh ngã",
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
      "Chúng mình cùng tìm hiểu về Thanh hỏi và thanh ngã nhé",
  },
  ordering: [
    "ton_tho_hoi",
    "ton_co_hoi",
    "ton_ho_hoi",
    "ton_sua_nga",
    "ton_mu_nga",
    "ton_go_nga",
  ],
};

export const C5_TON_04_SEED: SkillSeed = {
  identity: C5_TON_04_IDENTITY,
  dataset: C5_TON_04_DATASET,
  levels: [
    {
      code: "GL-C5-TON-TAP-0007",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-TCNT-0003",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
  ],
};
