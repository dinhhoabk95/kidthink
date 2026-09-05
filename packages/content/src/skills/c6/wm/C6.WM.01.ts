import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_WM_01_IDENTITY: SkillIdentity = {
  code: "C6.WM.01",
  strand_code: "C6.WM",
  competency_code: "C6",
  name: "Nhớ và thực hiện 2 bước",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["recall", "plan"],
  tier: "basic",
  prerequisites: ["C5.LIS.02"],
  learning_objectives: [
    {
      code: "LO-C6.WM.01-01",
      behaviour: "Nhận biết và thực hành Nhớ và thực hiện 2 bước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.WM.01-02",
      behaviour: "Vận dụng Nhớ và thực hiện 2 bước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.WM.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhớ và thực hiện 2 bước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_WM_01_DATASET: SkillDataset = {
  skill_code: "C6.WM.01",
  concept_label: "Nhớ và thực hiện 2 bước",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhớ và thực hiện 2 bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ và thực hiện 2 bước",
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
      "Chúng mình cùng tìm hiểu về Nhớ và thực hiện 2 bước nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C6_WM_01_SEED: SkillSeed = {
  identity: C6_WM_01_IDENTITY,
  dataset: C6_WM_01_DATASET,
  levels: [
    {
      code: "GL-C1-DOT-PAIR-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D1-08",
    },
    {
      code: "GL-C1-DOT-PAIR-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D1-08",
    },
    {
      code: "GL-C6-WM-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-GRID-0002",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
