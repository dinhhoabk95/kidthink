import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_MAZ_03_IDENTITY: SkillIdentity = {
  code: "C2.MAZ.03",
  strand_code: "C2.MAZ",
  competency_code: "C2",
  name: "Tìm đường ngắn nhất",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["plan", "compare"],
  tier: "advanced",
  prerequisites: ["C2.MAZ.02", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C2.MAZ.03-01",
      behaviour: "Nhận biết và thực hành Tìm đường ngắn nhất ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.MAZ.03-02",
      behaviour: "Vận dụng Tìm đường ngắn nhất trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.MAZ.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tìm đường ngắn nhất",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_MAZ_03_DATASET: SkillDataset = {
  skill_code: "C2.MAZ.03",
  concept_label: "Tìm đường ngắn nhất",
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
      description: "Làm quen cơ bản với Tìm đường ngắn nhất",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm đường ngắn nhất",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tìm đường ngắn nhất nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C2_MAZ_03_SEED: SkillSeed = {
  identity: C2_MAZ_03_IDENTITY,
  dataset: C2_MAZ_03_DATASET,
  levels: [
    {
      code: "GL-C2-MAZ-LOG-0006",
      template: "GT-013",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C2-MAZ-LOG-0007",
      template: "GT-013",
      band: "5-6",
      difficulty: 1,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C2-MAZ-LOG-0008",
      template: "GT-013",
      band: "5-6",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C2-MAZ-LOG-0009",
      template: "GT-013",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C2-MAZ-LOG-0010",
      template: "GT-013",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C2-MAZ-TAP-0001",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-TAP-0002",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-TCNT-0001",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-TCNT-0002",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-PAIR-0001",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-PAIR-0002",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-PATT-0001",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-PATT-0002",
      template: "GT-005",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
