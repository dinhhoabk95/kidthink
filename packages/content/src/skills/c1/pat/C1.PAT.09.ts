import { getPatternUnit } from "#src/inventories/index";

export const C1_PAT_09_UNIT = getPatternUnit("pat_abc");

import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_09_IDENTITY: SkillIdentity = {
  code: "C1.PAT.09",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Pattern hình",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe", "predict"],
  tier: "basic",
  prerequisites: ["C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.09-01",
      behaviour: "Nhận biết và thực hành Pattern hình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.09-02",
      behaviour: "Vận dụng Pattern hình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Pattern hình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_09_DATASET: SkillDataset = {
  skill_code: "C1.PAT.09",
  concept_label: "Pattern hình",
  surface: "game",
  items: [
    {
      id: "pat_square",
      label: "hình vuông",
      value: 2,
      image: {
        kind: "emoji",
        ref: "⬜",
      },
      contrast_group: "shape",
    },
    {
      id: "pat_triangle",
      label: "hình tam giác",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      contrast_group: "shape",
    },
    {
      id: "pat_circle",
      label: "hình tròn",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⚪",
      },
      contrast_group: "shape",
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "pat_circle",
      target_id: "pat_square",
    },
    {
      type: "sequence",
      source_id: "pat_square",
      target_id: "pat_triangle",
    },
    {
      type: "sequence",
      source_id: "pat_triangle",
      target_id: "pat_circle",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với pattern hình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng pattern hình",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt pattern hình với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi pattern hình",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục pattern hình và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Hình tiếp theo theo đúng quy luật là gì hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Pattern hình nhé",
  },
  ordering: ["pat_circle", "pat_square", "pat_triangle"],
};

export const C1_PAT_09_SEED: SkillSeed = {
  identity: C1_PAT_09_IDENTITY,
  dataset: C1_PAT_09_DATASET,
  levels: [
    {
      code: "GL-C1-PAT-TAP-0021",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0022",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0023",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TAP-0024",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0021",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0022",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0023",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-TCMP-0024",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0021",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0022",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0023",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-PATT-0024",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-SLOT-0004",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-SLOT-0005",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-SLOT-0006",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-SLOT-0007",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-MEMO-0005",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-MEMO-0006",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-MEMO-0007",
      template: "GT-012",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-PAT-MEMO-0008",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
