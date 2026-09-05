import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TAC_05_IDENTITY: SkillIdentity = {
  code: "C4.TAC.05",
  strand_code: "C4.TAC",
  competency_code: "C4",
  name: "Đoán vật trong túi bí mật",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "deduce"],
  tier: "advanced",
  prerequisites: ["C4.TAC.01", "C4.TAC.02"],
  learning_objectives: [
    {
      code: "LO-C4.TAC.05-01",
      behaviour:
        "Nhận biết và thực hành Đoán vật trong túi bí mật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TAC.05-02",
      behaviour:
        "Vận dụng Đoán vật trong túi bí mật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TAC.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đoán vật trong túi bí mật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TAC_05_DATASET: SkillDataset = {
  skill_code: "C4.TAC.05",
  concept_label: "Đoán vật trong túi bí mật",
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
      description: "Làm quen cơ bản với Đoán vật trong túi bí mật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đoán vật trong túi bí mật",
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
    narration_template:
      "Chúng mình cùng tìm hiểu về Đoán vật trong túi bí mật nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C4_TAC_05_SEED: SkillSeed = {
  identity: C4_TAC_05_IDENTITY,
  dataset: C4_TAC_05_DATASET,
  levels: [
    {
      code: "GL-C4-TAC-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-SHAD-0007",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-SHAD-0008",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
  ],
};
