import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_MAZ_01_IDENTITY: SkillIdentity = {
  code: "C2.MAZ.01",
  strand_code: "C2.MAZ",
  competency_code: "C2",
  name: "Mê cung một đường",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["plan"],
  tier: "basic",
  prerequisites: ["C2.DIR.05"],
  learning_objectives: [
    {
      code: "LO-C2.MAZ.01-01",
      behaviour: "Nhận biết và thực hành Mê cung một đường ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.MAZ.01-02",
      behaviour: "Vận dụng Mê cung một đường trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.MAZ.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Mê cung một đường",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_MAZ_01_DATASET: SkillDataset = {
  skill_code: "C2.MAZ.01",
  concept_label: "Mê cung một đường",
  surface: "game",
  items: [
    {
      id: "dog",
      label: "con chó",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "cat",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "chicken",
      label: "con gà",
      image: {
        kind: "emoji",
        ref: "🐓",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "duck",
      label: "con vịt",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "fish",
      label: "con cá",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "động vật",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Mê cung một đường",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Mê cung một đường",
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
    narration_template: "Chúng mình cùng tìm hiểu về Mê cung một đường nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C2_MAZ_01_SEED: SkillSeed = {
  identity: C2_MAZ_01_IDENTITY,
  dataset: C2_MAZ_01_DATASET,
  levels: [
    {
      code: "GL-C2-MAZ-PATH-0001",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-PATH-0002",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-LOG-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C2-MAZ-LOG-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C2-MAZ-LOG-0003",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C2-MAZ-LOG-0004",
      template: "GT-013",
      band: "4-5",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C2-MAZ-LOG-0005",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C2-MAZ-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-GRID-0002",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-GRID-0003",
      template: "GT-020",
      band: "3-4",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-GRID-0004",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
  ],
};
