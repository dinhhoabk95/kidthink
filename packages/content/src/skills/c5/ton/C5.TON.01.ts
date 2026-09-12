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
      id: "tmk_ngang",
      label: "thanh ngang",
      glyph: "—",
      image: {
        kind: "emoji",
        ref: "📝",
      },
      contrast_group: "primary",
    },
    {
      id: "tmk_huyen",
      label: "dấu huyền",
      glyph: "ˋ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
      contrast_group: "contrast",
    },
    {
      id: "tmk_sac",
      label: "dấu sắc",
      glyph: "ˊ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
      contrast_group: "primary",
    },
    {
      id: "tmk_nang",
      label: "dấu nặng",
      glyph: "﹒",
      image: {
        kind: "emoji",
        ref: "📝",
      },
      contrast_group: "contrast",
    },
    {
      id: "tmk_hoi",
      label: "dấu hỏi",
      glyph: "̉",
      image: {
        kind: "emoji",
        ref: "📝",
      },
      contrast_group: "primary",
    },
    {
      id: "tmk_nga",
      label: "dấu ngã",
      glyph: "˜",
      image: {
        kind: "emoji",
        ref: "📝",
      },
      contrast_group: "contrast",
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
    "tmk_ngang",
    "tmk_huyen",
    "tmk_sac",
    "tmk_nang",
    "tmk_hoi",
    "tmk_nga",
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
    {
      code: "GL-C5-TON-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
