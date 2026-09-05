import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SEN_04_IDENTITY: SkillIdentity = {
  code: "C4.SEN.04",
  strand_code: "C4.SEN",
  competency_code: "C4",
  name: "Phân biệt cao độ / âm sắc",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["compare", "listen"],
  tier: "advanced",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.SEN.04-01",
      behaviour:
        "Nhận biết và thực hành Phân biệt cao độ / âm sắc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SEN.04-02",
      behaviour:
        "Vận dụng Phân biệt cao độ / âm sắc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SEN.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân biệt cao độ / âm sắc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SEN_04_DATASET: SkillDataset = {
  skill_code: "C4.SEN.04",
  concept_label: "Phân biệt cao độ / âm sắc",
  surface: "game",
  items: [
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
    {
      id: "apple",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "banana",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Phân biệt cao độ / âm sắc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân biệt cao độ / âm sắc",
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
      "Chúng mình cùng tìm hiểu về Phân biệt cao độ / âm sắc nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C4_SEN_04_SEED: SkillSeed = {
  identity: C4_SEN_04_IDENTITY,
  dataset: C4_SEN_04_DATASET,
  levels: [
    {
      code: "GL-C4-SEN-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PATT-0007",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PATT-0008",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
  ],
};
