import { getPatternUnit } from "#src/inventories/index";

export const C1_PAT_03_UNIT = getPatternUnit("pat_aab");

import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_03_IDENTITY: SkillIdentity = {
  code: "C1.PAT.03",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật AAB",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "predict"],
  tier: "basic",
  prerequisites: ["C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.03-01",
      behaviour: "Nhận biết và thực hành Quy luật AAB ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.03-02",
      behaviour: "Vận dụng Quy luật AAB trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quy luật AAB",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_03_DATASET: SkillDataset = {
  skill_code: "C1.PAT.03",
  concept_label: "Quy luật AAB",
  surface: "game",
  items: [
    {
      id: "pat_heart_2",
      label: "trái tim đỏ hai",
      value: 2,
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      contrast_group: "a",
      category: {
        cycle: "A2",
      },
    },
    {
      id: "pat_diamond",
      label: "kim cương xanh",
      value: 3,
      image: {
        kind: "emoji",
        ref: "💎",
      },
      contrast_group: "b",
      category: {
        cycle: "B",
      },
    },
    {
      id: "pat_heart_repeat",
      label: "trái tim đỏ lặp lại",
      value: 4,
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      contrast_group: "a",
      category: {
        cycle: "A3",
      },
    },
    {
      id: "pat_heart_1",
      label: "trái tim đỏ một",
      value: 1,
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      contrast_group: "a",
      category: {
        cycle: "A1",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "pat_heart_1",
      target_id: "pat_heart_2",
      metadata: {
        rule: "AAB",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_heart_2",
      target_id: "pat_diamond",
      metadata: {
        rule: "AAB",
        period: 3,
      },
    },
    {
      type: "sequence",
      source_id: "pat_diamond",
      target_id: "pat_heart_repeat",
      metadata: {
        rule: "AAB",
        period: 3,
      },
    },
  ],
  axes: {
    cycle: {
      values: ["A1", "A2", "B", "A3"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với quy luật AAB",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng quy luật AAB",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt quy luật AAB với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi quy luật AAB",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục quy luật AAB và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Hình tiếp theo theo đúng quy luật là gì hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Quy luật AAB nhé",
  },
  ordering: ["pat_heart_1", "pat_heart_2", "pat_diamond", "pat_heart_repeat"],
};

export const C1_PAT_03_SEED: SkillSeed = {
  identity: C1_PAT_03_IDENTITY,
  dataset: C1_PAT_03_DATASET,
  levels: [
    {
      code: "GL-C3-PXT-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D3-01",
    },
    {
      code: "GL-C3-PXT-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D3-01",
    },
    {
      code: "GL-C1-PAT-TAP-0009",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0010",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0011",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0012",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCNT-0008",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0009",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0010",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0011",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0012",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PAIR-0007",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PAIR-0008",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0009",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0010",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0011",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0012",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
