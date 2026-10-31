import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_TMK_01_IDENTITY: SkillIdentity = {
  code: "C5.TMK.01",
  strand_code: "C5.TMK",
  competency_code: "C5",
  name: "Dấu ngang và dấu huyền",
  age_min: 5,
  age_max: 5,
  difficulty: 2,
  thinking_processes: ["observe", "compare"],
  tier: "core",
  prerequisites: ["C5.LET.01"],
  learning_objectives: [
    {
      code: "LO-C5.TMK.01-01",
      behaviour: "Nhận biết và thực hành Dấu ngang và dấu huyền ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.TMK.01-02",
      behaviour:
        "Phân biệt và so sánh Dấu ngang và dấu huyền trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.TMK.01-03",
      behaviour: "Vận dụng và ghi nhớ Dấu ngang và dấu huyền",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_TMK_01_DATASET: SkillDataset = {
  skill_code: "C5.TMK.01",
  concept_label: "Dấu ngang và dấu huyền",
  surface: "game",
  items: [
    {
      id: "tmk_ca",
      label: "thanh ngang (cái ca)",
      glyph: "ca",
      image: {
        kind: "emoji",
        ref: "☕",
      },
      category: {
        type: "thanh ngang",
        label: "Tiếng thanh ngang",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "tmk_hoa",
      label: "thanh ngang (bông hoa)",
      glyph: "hoa",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "thanh ngang",
        label: "Tiếng thanh ngang",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "tmk_ong",
      label: "thanh ngang (con ong)",
      glyph: "ong",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "thanh ngang",
        label: "Tiếng thanh ngang",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "tmk_ga",
      label: "dấu huyền (con gà)",
      glyph: "gà",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "dấu huyền",
        label: "Tiếng có dấu huyền",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "tmk_nha",
      label: "dấu huyền (ngôi nhà)",
      glyph: "nhà",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "dấu huyền",
        label: "Tiếng có dấu huyền",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "tmk_bo",
      label: "dấu huyền (con bò)",
      glyph: "bò",
      image: {
        kind: "emoji",
        ref: "🐮",
      },
      category: {
        type: "dấu huyền",
        label: "Tiếng có dấu huyền",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Dấu ngang và dấu huyền",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dấu ngang và dấu huyền",
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
      "Chúng mình cùng tìm hiểu về Dấu ngang và dấu huyền nhé",
  },
  ordering: ["tmk_ca", "tmk_hoa", "tmk_ong", "tmk_ga", "tmk_nha", "tmk_bo"],
  axes: {
    category: {
      values: ["thanh ngang", "dấu huyền"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "tmk_ca",
      target_id: "tmk_hoa",
    },
    {
      type: "pair",
      source_id: "tmk_ga",
      target_id: "tmk_nha",
    },
    {
      type: "contrast",
      source_id: "tmk_ca",
      target_id: "tmk_ga",
    },
  ],
};

export const C5_TMK_01_SEED: SkillSeed = {
  identity: C5_TMK_01_IDENTITY,
  dataset: C5_TMK_01_DATASET,
  levels: [
    {
      code: "GL-C5-TMK-INTRO-0001",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.TMK.01"],
    },
    {
      code: "GL-C5-TMK-TAP-0001",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-TAP-0003",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-PAIR-0001",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
