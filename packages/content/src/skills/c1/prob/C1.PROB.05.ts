import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PROB_05_IDENTITY: SkillIdentity = {
  code: "C1.PROB.05",
  strand_code: "C1.PROB",
  competency_code: "C1",
  name: "Ghép nhóm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sort", "solve"],
  tier: "advanced",
  prerequisites: ["C1.CNT.06"],
  learning_objectives: [
    {
      code: "LO-C1.PROB.05-01",
      behaviour: "Nhận biết và thực hành Ghép nhóm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PROB.05-02",
      behaviour: "Vận dụng Ghép nhóm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PROB.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép nhóm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PROB_05_DATASET: SkillDataset = {
  skill_code: "C1.PROB.05",
  concept_label: "Ghép nhóm",
  surface: "game",
  items: [
    {
      id: "bowl",
      label: "cái bát",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "spoon",
      label: "cái thìa",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "cup",
      label: "cái cốc",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "bed",
      label: "cái giường",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "chair",
      label: "cái ghế",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ dùng",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ghép nhóm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghép nhóm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ghép nhóm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C1_PROB_05_SEED: SkillSeed = {
  identity: C1_PROB_05_IDENTITY,
  dataset: C1_PROB_05_DATASET,
  levels: [
    {
      code: "GL-C1-QNT-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D1-03",
    },
    {
      code: "GL-C1-QNT-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D1-03",
    },
    {
      code: "GL-C1-PROB-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCNT-0008",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0010",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0011",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0012",
      template: "GT-003",
      band: "4-5",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0013",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PAIR-0007",
      template: "GT-004",
      band: "4-5",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PAIR-0008",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SLOT-0005",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SLOT-0006",
      template: "GT-008",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SLOT-0007",
      template: "GT-008",
      band: "4-5",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-SLOT-0008",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-HIDE-0009",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-HIDE-0010",
      template: "GT-015",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-HIDE-0011",
      template: "GT-015",
      band: "5-6",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-HIDE-0012",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
