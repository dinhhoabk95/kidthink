import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_TON_06_IDENTITY: SkillIdentity = {
  code: "C5.TON.06",
  strand_code: "C5.TON",
  competency_code: "C5",
  name: "Đổi thanh, đổi nghĩa",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["compare", "infer"],
  tier: "advanced",
  prerequisites: ["C5.TON.04"],
  learning_objectives: [
    {
      code: "LO-C5.TON.06-01",
      behaviour: "Nhận biết và thực hành Đổi thanh, đổi nghĩa ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.TON.06-02",
      behaviour: "Vận dụng Đổi thanh, đổi nghĩa trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.TON.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đổi thanh, đổi nghĩa",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_TON_06_DATASET: SkillDataset = {
  skill_code: "C5.TON.06",
  concept_label: "Đổi thanh, đổi nghĩa",
  surface: "game",
  items: [
    {
      id: "ton_ba_ngang",
      label: "ba (người lớn)",
      glyph: "ba",
      image: {
        kind: "emoji",
        ref: "👨",
      },
      category: {
        type: "tiếng thanh ngang",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "ton_ca_ngang",
      label: "ca (uống nước)",
      glyph: "ca",
      image: {
        kind: "emoji",
        ref: "☕",
      },
      category: {
        type: "tiếng thanh ngang",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "ton_la_ngang",
      label: "la (hát to)",
      glyph: "la",
      image: {
        kind: "emoji",
        ref: "🎵",
      },
      category: {
        type: "tiếng thanh ngang",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "ton_ba_huyen",
      label: "bà (bà hiền)",
      glyph: "bà",
      image: {
        kind: "emoji",
        ref: "👵",
      },
      category: {
        type: "tiếng đổi thanh",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "ton_ca_sac",
      label: "cá (bơi lội)",
      glyph: "cá",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "tiếng đổi thanh",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "ton_la_sac",
      label: "lá (lá cây)",
      glyph: "lá",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "tiếng đổi thanh",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["tiếng thanh ngang", "tiếng đổi thanh"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "ton_ba_ngang",
      target_id: "ton_ba_huyen",
    },
    {
      type: "pair",
      source_id: "ton_ca_ngang",
      target_id: "ton_ca_sac",
    },
    {
      type: "pair",
      source_id: "ton_la_ngang",
      target_id: "ton_la_sac",
    },
    {
      type: "contrast",
      source_id: "ton_ba_ngang",
      target_id: "ton_ba_huyen",
    },
    {
      type: "contrast",
      source_id: "ton_ca_ngang",
      target_id: "ton_ca_sac",
    },
    {
      type: "contrast",
      source_id: "ton_la_ngang",
      target_id: "ton_la_sac",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đổi thanh, đổi nghĩa",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đổi thanh, đổi nghĩa",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đổi thanh, đổi nghĩa nhé",
  },
  ordering: [
    "ton_ba_ngang",
    "ton_ca_ngang",
    "ton_la_ngang",
    "ton_ba_huyen",
    "ton_ca_sac",
    "ton_la_sac",
  ],
};

export const C5_TON_06_SEED: SkillSeed = {
  identity: C5_TON_06_IDENTITY,
  dataset: C5_TON_06_DATASET,
  levels: [
    {
      code: "GL-C5-TON-TAP-0011",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-TAP-0012",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-TCNT-0007",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
  ],
};
