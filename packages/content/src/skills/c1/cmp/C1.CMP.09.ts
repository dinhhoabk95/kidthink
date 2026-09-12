import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_09_IDENTITY: SkillIdentity = {
  code: "C1.CMP.09",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Thấp hơn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.09-01",
      behaviour: "Nhận biết và thực hành Thấp hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.09-02",
      behaviour: "Vận dụng Thấp hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thấp hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_09_DATASET: SkillDataset = {
  skill_code: "C1.CMP.09",
  concept_label: "Thấp hơn",
  surface: "game",
  items: [
    {
      id: "height_less",
      label: "ngôi nhà thấp",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      contrast_group: "height",
      category: {
        height: "thấp",
      },
    },
    {
      id: "height_more",
      label: "ngôi nhà cao",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🏢",
      },
      contrast_group: "height",
      category: {
        height: "cao",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "height_less",
      target_id: "height_more",
      metadata: {
        dimension: "height",
      },
    },
  ],
  axes: {
    height: {
      values: ["thấp", "cao"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với thấp hơn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng thấp hơn",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt thấp hơn với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi thấp hơn",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục thấp hơn và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Vật nào thấp hơn hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Thấp hơn nhé",
  },
};

export const C1_CMP_09_SEED: SkillSeed = {
  identity: C1_CMP_09_IDENTITY,
  dataset: C1_CMP_09_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-TAP-0037",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0038",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0039",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0040",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0041",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0039",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0040",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0041",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0042",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0043",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0039",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0040",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0041",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0042",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0043",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0037",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0038",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0039",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0040",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0041",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
  ],
};
