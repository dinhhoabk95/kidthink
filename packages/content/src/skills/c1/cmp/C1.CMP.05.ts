import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { getMeasureDimension } from "#src/inventories/index";

export const C1_CMP_05_IDENTITY: SkillIdentity = {
  code: "C1.CMP.05",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Ít hơn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare", "count"],
  tier: "basic",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.CMP.05-01",
      behaviour: "Nhận biết và thực hành Ít hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.05-02",
      behaviour: "Vận dụng Ít hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ít hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_05_DATASET: SkillDataset = {
  skill_code: "C1.CMP.05",
  concept_label: "Ít hơn",
  surface: "game",
  items: [
    {
      id: "qty_less",
      label: "ít viên kẹo",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      contrast_group: "quantity",
      category: {
        quantity: "ít",
      },
    },
    {
      id: "qty_more",
      label: "nhiều viên kẹo",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      contrast_group: "quantity",
      category: {
        quantity: "nhiều",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "qty_less",
      target_id: "qty_more",
      metadata: {
        dimension: getMeasureDimension("dim_quantity").unit_kind,
      },
    },
  ],
  axes: {
    quantity: {
      values: ["ít", "nhiều"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ít hơn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng ít hơn",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt ít hơn với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi ít hơn",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục ít hơn và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bên nào có ít hơn hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Ít hơn nhé",
  },
};

export const C1_CMP_05_SEED: SkillSeed = {
  identity: C1_CMP_05_IDENTITY,
  dataset: C1_CMP_05_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-CARD-0116",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB06-D1",
    },
    {
      code: "GL-C1-QNT-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D1-03",
    },
    {
      code: "GL-C1-CMP-TAP-0019",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0020",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0021",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCMP-0007",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0020",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0021",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0022",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0023",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0020",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0021",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0022",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0023",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0019",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0020",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0021",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
  ],
};
