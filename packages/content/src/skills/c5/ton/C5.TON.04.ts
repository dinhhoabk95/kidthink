import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_TON_04_IDENTITY: SkillIdentity = {
  code: "C5.TON.04",
  strand_code: "C5.TON",
  competency_code: "C5",
  name: "Thanh hỏi và thanh ngã",
  age_min: 6,
  age_max: 7,
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
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "tmk_hoi",
    "tmk_nga",
    "tmk_nang",
    "tmk_sac",
    "tmk_ngang",
    "tmk_huyen",
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
    {
      code: "GL-C5-TON-TCNT-0004",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PAIR-0003",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PAIR-0004",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PATT-0007",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-PATT-0008",
      template: "GT-005",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-TON-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
