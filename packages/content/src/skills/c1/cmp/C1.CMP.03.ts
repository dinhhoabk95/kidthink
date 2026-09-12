import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { getMeasureDimension } from "#src/inventories/index";

export const C1_CMP_03_IDENTITY: SkillIdentity = {
  code: "C1.CMP.03",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Bằng nhau",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.01", "C1.CMP.02"],
  learning_objectives: [
    {
      code: "LO-C1.CMP.03-01",
      behaviour: "Nhận biết và thực hành Bằng nhau ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.03-02",
      behaviour: "Vận dụng Bằng nhau trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Bằng nhau",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_03_DATASET: SkillDataset = {
  skill_code: "C1.CMP.03",
  concept_label: "Bằng nhau",
  surface: "game",
  items: [
    {
      id: "pair_a",
      label: "hai quả táo",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "same",
      category: {
        quantity: "hai",
      },
    },
    {
      id: "pair_b",
      label: "hai quả cam",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      contrast_group: "same",
      category: {
        quantity: "hai",
      },
    },
    {
      id: "pair_c",
      label: "ba quả chuối",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      contrast_group: "different",
      category: {
        quantity: "ba",
      },
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "pair_a",
      target_id: "pair_b",
      metadata: {
        dimension: getMeasureDimension("dim_quantity").unit_kind,
        relation: "equal_quantity",
      },
    },
    {
      type: "contrast",
      source_id: "pair_a",
      target_id: "pair_c",
      metadata: {
        dimension: getMeasureDimension("dim_quantity").unit_kind,
        relation: "different_quantity",
      },
    },
  ],
  axes: {
    quantity: {
      values: ["hai", "ba"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với bằng nhau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng bằng nhau",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt bằng nhau với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi bằng nhau",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục bằng nhau và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Hai bên nào có số lượng bằng nhau hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Bằng nhau nhé",
  },
};

export const C1_CMP_03_SEED: SkillSeed = {
  identity: C1_CMP_03_IDENTITY,
  dataset: C1_CMP_03_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-CONT-0118",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB06-D2",
    },
    {
      code: "GL-C1-CMP-TAP-0011",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0012",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0013",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0014",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0015",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0011",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0012",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0013",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0014",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0015",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0011",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0012",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0013",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0014",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0015",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0011",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0012",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0013",
      template: "GT-012",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0014",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0015",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
  ],
};
