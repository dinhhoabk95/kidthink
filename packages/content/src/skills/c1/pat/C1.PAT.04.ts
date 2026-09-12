import { getPatternUnit } from "#src/inventories/index";

export const C1_PAT_04_UNIT = getPatternUnit("pat_abc");

import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_04_IDENTITY: SkillIdentity = {
  code: "C1.PAT.04",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật ABC",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["observe", "predict"],
  tier: "core",
  prerequisites: ["C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.04-01",
      behaviour: "Nhận biết và thực hành Quy luật ABC ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.04-02",
      behaviour: "Vận dụng Quy luật ABC trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quy luật ABC",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_04_DATASET: SkillDataset = {
  skill_code: "C1.PAT.04",
  concept_label: "Quy luật ABC",
  surface: "game",
  items: [
    {
      id: "pat_flower",
      label: "bông hoa hồng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      contrast_group: "a",
      category: {
        cycle: "A",
      },
    },
    {
      id: "pat_leaf",
      label: "chiếc lá xanh",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      contrast_group: "b",
      category: {
        cycle: "B",
      },
    },
    {
      id: "pat_sun",
      label: "mặt trời vàng",
      value: 3,
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      contrast_group: "c",
      category: {
        cycle: "C",
      },
    },
    {
      id: "pat_star",
      label: "ngôi sao vàng",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      contrast_group: "d",
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "pat_flower",
      target_id: "pat_leaf",
      metadata: {
        rule: "ABC",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_leaf",
      target_id: "pat_sun",
      metadata: {
        rule: "ABC",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_sun",
      target_id: "pat_flower",
      metadata: {
        rule: "ABC",
        period: 3,
      },
    },
  ],
  axes: {
    cycle: {
      values: ["A", "B", "C"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với quy luật ABC",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng quy luật ABC",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt quy luật ABC với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi quy luật ABC",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục quy luật ABC và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Hình tiếp theo theo đúng quy luật là gì hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Quy luật ABC nhé",
  },
  ordering: ["pat_flower", "pat_leaf", "pat_sun"],
};

export const C1_PAT_04_SEED: SkillSeed = {
  identity: C1_PAT_04_IDENTITY,
  dataset: C1_PAT_04_DATASET,
  levels: [
    {
      code: "GL-C1-PAT-SEQ-0122",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
      montessori_ref: "WB15-D1",
    },
    {
      code: "GL-C1-PAT-SLOT-0136",
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
      montessori_ref: "WB15-D2",
    },
    {
      code: "GL-C1-PAT-TAP-0013",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0014",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0015",
      template: "GT-001",
      band: "3-4",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0016",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCNT-0010",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCNT-0011",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCNT-0012",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0013",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0014",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0015",
      template: "GT-003",
      band: "3-4",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0016",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PAIR-0009",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PAIR-0010",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PAIR-0011",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PAIR-0012",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0013",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0014",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0015",
      template: "GT-005",
      band: "3-4",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0016",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
  ],
};
