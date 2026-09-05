import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_04_IDENTITY: SkillIdentity = {
  code: "C4.MAT.04",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Bốn mùa",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sort", "sequence"],
  tier: "core",
  prerequisites: ["C4.MAT.01"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.04-01",
      behaviour: "Nhận biết và thực hành Bốn mùa ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.04-02",
      behaviour: "Vận dụng Bốn mùa trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Bốn mùa",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_04_DATASET: SkillDataset = {
  skill_code: "C4.MAT.04",
  concept_label: "Bốn mùa",
  surface: "game",
  items: [
    {
      id: "corn",
      label: "bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "rau củ",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Bốn mùa",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Bốn mùa",
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
    narration_template: "Chúng mình cùng tìm hiểu về Bốn mùa nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C4_MAT_04_SEED: SkillSeed = {
  identity: C4_MAT_04_IDENTITY,
  dataset: C4_MAT_04_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0007",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0008",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-SLOT-0004",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
