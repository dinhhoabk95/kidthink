import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_WM_03_IDENTITY: SkillIdentity = {
  code: "C6.WM.03",
  strand_code: "C6.WM",
  competency_code: "C6",
  name: "Nhớ vị trí sau khi bị che",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["recall"],
  tier: "core",
  prerequisites: ["C4.MEM.01"],
  learning_objectives: [
    {
      code: "LO-C6.WM.03-01",
      behaviour:
        "Nhận biết và thực hành Nhớ vị trí sau khi bị che ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.WM.03-02",
      behaviour:
        "Vận dụng Nhớ vị trí sau khi bị che trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.WM.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhớ vị trí sau khi bị che",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_WM_03_DATASET: SkillDataset = {
  skill_code: "C6.WM.03",
  concept_label: "Nhớ vị trí sau khi bị che",
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
      description: "Làm quen cơ bản với Nhớ vị trí sau khi bị che",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ vị trí sau khi bị che",
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
      "Chúng mình cùng tìm hiểu về Nhớ vị trí sau khi bị che nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C6_WM_03_SEED: SkillSeed = {
  identity: C6_WM_03_IDENTITY,
  dataset: C6_WM_03_DATASET,
  levels: [
    {
      code: "GL-C6-MEM-CARD-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-CARD-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-BOX-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-SEQ-0006",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-CMP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-SUB-FAST-0009",
      template: "GT-012",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-CARD-0010",
      template: "GT-012",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-SEQ-0012",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-SUB-FAST-0013",
      template: "GT-012",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-CMP-0015",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D6-11",
    },
    {
      code: "GL-C6-MEM-SEQ-0017",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-BOX-0020",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLIP-0024",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLIP-0025",
      template: "GT-020",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLIP-0026",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLIP-0034",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-SER-ORD-0009",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D3-03",
    },
    {
      code: "GL-C3-SER-ORD-0010",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D3-03",
    },
    {
      code: "GL-C1-DOT-PAIR-0006",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D1-08",
    },
    {
      code: "GL-C1-DOT-PAIR-0007",
      template: "GT-005",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D1-08",
    },
    {
      code: "GL-C1-DOT-PAIR-0008",
      template: "GT-005",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D1-08",
    },
  ],
};
