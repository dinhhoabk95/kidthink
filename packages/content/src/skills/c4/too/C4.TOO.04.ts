import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TOO_04_IDENTITY: SkillIdentity = {
  code: "C4.TOO.04",
  strand_code: "C4.TOO",
  competency_code: "C4",
  name: "Cân và thước",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["count", "verify"],
  tier: "core",
  prerequisites: ["C1.MEAS.07", "C1.MEAS.08"],
  learning_objectives: [
    {
      code: "LO-C4.TOO.04-01",
      behaviour: "Nhận biết và thực hành Cân và thước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TOO.04-02",
      behaviour: "Vận dụng Cân và thước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TOO.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cân và thước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TOO_04_DATASET: SkillDataset = {
  skill_code: "C4.TOO.04",
  concept_label: "Cân và thước",
  surface: "game",
  items: [
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
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
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
      description: "Làm quen cơ bản với Cân và thước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Cân và thước",
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
    narration_template: "Chúng mình cùng tìm hiểu về Cân và thước nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C4_TOO_04_SEED: SkillSeed = {
  identity: C4_TOO_04_IDENTITY,
  dataset: C4_TOO_04_DATASET,
  levels: [
    {
      code: "GL-C4-TOO-TAP-0003",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-TAP-0004",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-TCMP-0003",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-TCMP-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SHAD-0006",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-MEMO-0001",
      template: "GT-012",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-MEMO-0002",
      template: "GT-012",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
  ],
};
