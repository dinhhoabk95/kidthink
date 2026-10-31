import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_TON_05_IDENTITY: SkillIdentity = {
  code: "C5.TON.05",
  strand_code: "C5.TON",
  competency_code: "C5",
  name: "Nhận dấu thanh trên chữ",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["observe", "match"],
  tier: "advanced",
  prerequisites: ["C5.TON.03", "C5.ALP.04", "C5.TMK.03"],
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
      id: "ton_dau_ngang",
      label: "chữ thanh ngang",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "☕",
      },
      category: {
        type: "dấu thanh một",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "ton_dau_huyen",
      label: "chữ dấu huyền",
      glyph: "à",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "dấu thanh một",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "ton_dau_sac",
      label: "chữ dấu sắc",
      glyph: "á",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "dấu thanh một",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "ton_dau_nang",
      label: "chữ dấu nặng",
      glyph: "ạ",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "dấu thanh hai",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "ton_dau_hoi",
      label: "chữ dấu hỏi",
      glyph: "ả",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "dấu thanh hai",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "ton_dau_nga",
      label: "chữ dấu ngã",
      glyph: "ã",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "dấu thanh hai",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["dấu thanh một", "dấu thanh hai"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "ton_dau_ngang",
      target_id: "ton_dau_nang",
    },
    {
      type: "pair",
      source_id: "ton_dau_huyen",
      target_id: "ton_dau_hoi",
    },
    {
      type: "pair",
      source_id: "ton_dau_sac",
      target_id: "ton_dau_nga",
    },
    {
      type: "contrast",
      source_id: "ton_dau_ngang",
      target_id: "ton_dau_nang",
    },
    {
      type: "contrast",
      source_id: "ton_dau_huyen",
      target_id: "ton_dau_hoi",
    },
    {
      type: "contrast",
      source_id: "ton_dau_sac",
      target_id: "ton_dau_nga",
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
  },
  ordering: [
    "ton_dau_ngang",
    "ton_dau_huyen",
    "ton_dau_sac",
    "ton_dau_nang",
    "ton_dau_hoi",
    "ton_dau_nga",
  ],
};

export const C5_TON_05_SEED: SkillSeed = {
  identity: C5_TON_05_IDENTITY,
  dataset: C5_TON_05_DATASET,
  levels: [
    {
      code: "GL-C5-TON-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PATT-0009",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PATT-0010",
      template: "GT-005",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
