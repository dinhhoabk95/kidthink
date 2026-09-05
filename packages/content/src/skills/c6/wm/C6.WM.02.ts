import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_WM_02_IDENTITY: SkillIdentity = {
  code: "C6.WM.02",
  strand_code: "C6.WM",
  competency_code: "C6",
  name: "Nhớ và thực hiện 3 bước",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["recall", "plan"],
  tier: "advanced",
  prerequisites: ["C6.WM.01"],
  learning_objectives: [
    {
      code: "LO-C6.WM.02-01",
      behaviour: "Nhận biết và thực hành Nhớ và thực hiện 3 bước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.WM.02-02",
      behaviour: "Vận dụng Nhớ và thực hiện 3 bước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.WM.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhớ và thực hiện 3 bước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_WM_02_DATASET: SkillDataset = {
  skill_code: "C6.WM.02",
  concept_label: "Nhớ và thực hiện 3 bước",
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
      description: "Làm quen cơ bản với Nhớ và thực hiện 3 bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ và thực hiện 3 bước",
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
      "Chúng mình cùng tìm hiểu về Nhớ và thực hiện 3 bước nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C6_WM_02_SEED: SkillSeed = {
  identity: C6_WM_02_IDENTITY,
  dataset: C6_WM_02_DATASET,
  levels: [
    {
      code: "GL-C1-DOT-PAIR-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D1-08",
    },
    {
      code: "GL-C1-DOT-PAIR-0004",
      template: "GT-005",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D1-08",
    },
    {
      code: "GL-C1-DOT-PAIR-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D1-08",
    },
    {
      code: "GL-C6-MEM-FLS-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D1-13",
    },
    {
      code: "GL-C6-MEM-FLS-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D1-13",
    },
    {
      code: "GL-C6-MEM-FLS-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D1-13",
    },
    {
      code: "GL-C6-MEM-FLS-0004",
      template: "GT-012",
      band: "4-5",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D1-13",
    },
    {
      code: "GL-C6-MEM-FLS-0005",
      template: "GT-012",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D1-13",
    },
    {
      code: "GL-C6-MEM-GRD-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D6-11",
    },
    {
      code: "GL-C6-MEM-GRD-0002",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D6-11",
    },
    {
      code: "GL-C6-MEM-GRD-0003",
      template: "GT-020",
      band: "3-4",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D6-11",
    },
    {
      code: "GL-C6-MEM-GRD-0004",
      template: "GT-020",
      band: "4-5",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D6-11",
    },
    {
      code: "GL-C6-MEM-GRD-0005",
      template: "GT-020",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D6-11",
    },
    {
      code: "GL-C6-WM-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-SHAD-0004",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
  ],
};
