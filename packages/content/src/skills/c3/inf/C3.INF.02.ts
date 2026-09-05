import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_INF_02_IDENTITY: SkillIdentity = {
  code: "C3.INF.02",
  strand_code: "C3.INF",
  competency_code: "C3",
  name: "Đoán kết quả",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["predict", "infer"],
  tier: "advanced",
  prerequisites: ["C3.DED.02"],
  learning_objectives: [
    {
      code: "LO-C3.INF.02-01",
      behaviour: "Nhận biết và thực hành Đoán kết quả ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.INF.02-02",
      behaviour: "Vận dụng Đoán kết quả trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.INF.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đoán kết quả",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_INF_02_DATASET: SkillDataset = {
  skill_code: "C3.INF.02",
  concept_label: "Đoán kết quả",
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
      description: "Làm quen cơ bản với Đoán kết quả",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đoán kết quả",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đoán kết quả nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C3_INF_02_SEED: SkillSeed = {
  identity: C3_INF_02_IDENTITY,
  dataset: C3_INF_02_DATASET,
  levels: [
    {
      code: "GL-C3-ODD-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D4-05",
    },
    {
      code: "GL-C3-ODD-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D4-05",
    },
    {
      code: "GL-C3-CAU-PAIR-0009",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D6-03",
    },
    {
      code: "GL-C3-CAU-PAIR-0010",
      template: "GT-005",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D6-03",
    },
    {
      code: "GL-C4-PIC-SLOT-0007",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D6-04",
    },
    {
      code: "GL-C4-PIC-SLOT-0008",
      template: "GT-008",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D6-04",
    },
    {
      code: "GL-C3-INF-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-SHAD-0003",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-SHAD-0004",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-SIZE-0004",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-PUZZ-0003",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-PUZZ-0004",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
  ],
};
