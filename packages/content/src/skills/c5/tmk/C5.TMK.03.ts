import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_TMK_03_IDENTITY: SkillIdentity = {
  code: "C5.TMK.03",
  strand_code: "C5.TMK",
  competency_code: "C5",
  name: "Dấu hỏi và dấu ngã",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["observe", "compare"],
  tier: "advanced",
  prerequisites: ["C5.TMK.02"],
  learning_objectives: [
    {
      code: "LO-C5.TMK.03-01",
      behaviour: "Nhận biết và thực hành Dấu hỏi và dấu ngã ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.TMK.03-02",
      behaviour:
        "Phân biệt và so sánh Dấu hỏi và dấu ngã trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.TMK.03-03",
      behaviour: "Vận dụng và ghi nhớ Dấu hỏi và dấu ngã",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_TMK_03_DATASET: SkillDataset = {
  skill_code: "C5.TMK.03",
  concept_label: "Dấu hỏi và dấu ngã",
  surface: "game",
  items: [
    {
      id: "tmk_tho_hoi",
      label: "dấu hỏi (con thỏ)",
      glyph: "thỏ",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "dấu hỏi",
        label: "Tiếng có dấu hỏi",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "tmk_co_hoi",
      label: "dấu hỏi (ngọn cỏ)",
      glyph: "cỏ",
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      category: {
        type: "dấu hỏi",
        label: "Tiếng có dấu hỏi",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "tmk_ho_hoi",
      label: "dấu hỏi (con hổ)",
      glyph: "hổ",
      image: {
        kind: "emoji",
        ref: "🐯",
      },
      category: {
        type: "dấu hỏi",
        label: "Tiếng có dấu hỏi",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "tmk_sua_nga",
      label: "dấu ngã (cốc sữa)",
      glyph: "sữa",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "dấu ngã",
        label: "Tiếng có dấu ngã",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "tmk_mu_nga",
      label: "dấu ngã (cái mũ)",
      glyph: "mũ",
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      category: {
        type: "dấu ngã",
        label: "Tiếng có dấu ngã",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "tmk_go_nga",
      label: "dấu ngã (khúc gỗ)",
      glyph: "gỗ",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "dấu ngã",
        label: "Tiếng có dấu ngã",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Dấu hỏi và dấu ngã",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dấu hỏi và dấu ngã",
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
    narration_template: "Chúng mình cùng tìm hiểu về Dấu hỏi và dấu ngã nhé",
  },
  ordering: [
    "tmk_tho_hoi",
    "tmk_co_hoi",
    "tmk_ho_hoi",
    "tmk_sua_nga",
    "tmk_mu_nga",
    "tmk_go_nga",
  ],
  axes: {
    category: {
      values: ["dấu hỏi", "dấu ngã"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "tmk_tho_hoi",
      target_id: "tmk_co_hoi",
    },
    {
      type: "pair",
      source_id: "tmk_sua_nga",
      target_id: "tmk_mu_nga",
    },
    {
      type: "contrast",
      source_id: "tmk_tho_hoi",
      target_id: "tmk_sua_nga",
    },
  ],
};

export const C5_TMK_03_SEED: SkillSeed = {
  identity: C5_TMK_03_IDENTITY,
  dataset: C5_TMK_03_DATASET,
  levels: [
    {
      code: "GL-C5-TMK-INTRO-0003",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "home",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.TMK.03"],
    },
    {
      code: "GL-C5-TMK-TAP-0011",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-TAP-0013",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-PAIR-0011",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
