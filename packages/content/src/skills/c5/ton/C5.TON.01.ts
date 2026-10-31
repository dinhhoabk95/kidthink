import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_TON_01_IDENTITY: SkillIdentity = {
  code: "C5.TON.01",
  strand_code: "C5.TON",
  competency_code: "C5",
  name: "Nghe ra hai tiếng khác thanh",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "compare"],
  tier: "core",
  prerequisites: ["C5.PHO.01"],
  learning_objectives: [
    {
      code: "LO-C5.TON.01-01",
      behaviour:
        "Nhận biết và thực hành Nghe ra hai tiếng khác thanh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.TON.01-02",
      behaviour:
        "Vận dụng Nghe ra hai tiếng khác thanh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.TON.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nghe ra hai tiếng khác thanh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_TON_01_DATASET: SkillDataset = {
  skill_code: "C5.TON.01",
  concept_label: "Nghe ra hai tiếng khác thanh",
  surface: "game",
  items: [
    {
      id: "ton_ca",
      label: "tiếng ca",
      glyph: "ca",
      image: {
        kind: "emoji",
        ref: "☕",
      },
      category: {
        type: "tiếng thanh ngang",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "ton_ba",
      label: "tiếng ba",
      glyph: "ba",
      image: {
        kind: "emoji",
        ref: "👨",
      },
      category: {
        type: "tiếng thanh ngang",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "ton_la",
      label: "tiếng la",
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
      id: "ton_ca_sac",
      label: "tiếng cá",
      glyph: "cá",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "tiếng có dấu",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "ton_ba_huyen",
      label: "tiếng bà",
      glyph: "bà",
      image: {
        kind: "emoji",
        ref: "👵",
      },
      category: {
        type: "tiếng có dấu",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "ton_la_sac",
      label: "tiếng lá",
      glyph: "lá",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "tiếng có dấu",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["tiếng thanh ngang", "tiếng có dấu"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "ton_ca",
      target_id: "ton_ca_sac",
    },
    {
      type: "pair",
      source_id: "ton_ba",
      target_id: "ton_ba_huyen",
    },
    {
      type: "pair",
      source_id: "ton_la",
      target_id: "ton_la_sac",
    },
    {
      type: "contrast",
      source_id: "ton_ca",
      target_id: "ton_ca_sac",
    },
    {
      type: "contrast",
      source_id: "ton_ba",
      target_id: "ton_ba_huyen",
    },
    {
      type: "contrast",
      source_id: "ton_la",
      target_id: "ton_la_sac",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe ra hai tiếng khác thanh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe ra hai tiếng khác thanh",
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
      "Chúng mình cùng tìm hiểu về Nghe ra hai tiếng khác thanh nhé",
  },
  ordering: [
    "ton_ca",
    "ton_ba",
    "ton_la",
    "ton_ca_sac",
    "ton_ba_huyen",
    "ton_la_sac",
  ],
};

export const C5_TON_01_SEED: SkillSeed = {
  identity: C5_TON_01_IDENTITY,
  dataset: C5_TON_01_DATASET,
  levels: [
    {
      code: "GL-C5-TON-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
