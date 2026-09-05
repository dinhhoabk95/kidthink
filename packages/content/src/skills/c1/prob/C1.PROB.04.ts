import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PROB_04_IDENTITY: SkillIdentity = {
  code: "C1.PROB.04",
  strand_code: "C1.PROB",
  competency_code: "C1",
  name: "Chia nhóm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sort", "solve"],
  tier: "advanced",
  prerequisites: ["C1.PROB.03"],
  learning_objectives: [
    {
      code: "LO-C1.PROB.04-01",
      behaviour: "Nhận biết và thực hành Chia nhóm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PROB.04-02",
      behaviour: "Vận dụng Chia nhóm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PROB.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chia nhóm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PROB_04_DATASET: SkillDataset = {
  skill_code: "C1.PROB.04",
  concept_label: "Chia nhóm",
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
      description: "Làm quen cơ bản với Chia nhóm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chia nhóm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chia nhóm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C1_PROB_04_SEED: SkillSeed = {
  identity: C1_PROB_04_IDENTITY,
  dataset: C1_PROB_04_DATASET,
  levels: [
    {
      code: "GL-C1-QNT-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D1-03",
    },
    {
      code: "GL-C1-QNT-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D1-03",
    },
    {
      code: "GL-C1-PROB-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0006",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0007",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0008",
      template: "GT-003",
      band: "4-5",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0009",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SLOT-0002",
      template: "GT-008",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SLOT-0003",
      template: "GT-008",
      band: "4-5",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-HIDE-0005",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-HIDE-0006",
      template: "GT-015",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-HIDE-0007",
      template: "GT-015",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-HIDE-0008",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
  ],
};
