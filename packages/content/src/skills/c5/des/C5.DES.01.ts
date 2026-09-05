import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DES_01_IDENTITY: SkillIdentity = {
  code: "C5.DES.01",
  strand_code: "C5.DES",
  competency_code: "C5",
  name: "Miêu tả một vật",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["describe", "observe"],
  tier: "basic",
  prerequisites: ["C4.DET.01"],
  learning_objectives: [
    {
      code: "LO-C5.DES.01-01",
      behaviour: "Nhận biết và thực hành Miêu tả một vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DES.01-02",
      behaviour: "Vận dụng Miêu tả một vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DES.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Miêu tả một vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DES_01_DATASET: SkillDataset = {
  skill_code: "C5.DES.01",
  concept_label: "Miêu tả một vật",
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
      description: "Làm quen cơ bản với Miêu tả một vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Miêu tả một vật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Miêu tả một vật nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C5_DES_01_SEED: SkillSeed = {
  identity: C5_DES_01_IDENTITY,
  dataset: C5_DES_01_DATASET,
  levels: [
    {
      code: "GL-C5-EXP-CMP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-EXP-CMP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-EXP-CMP-0013",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-SEQ-0014",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-EXP-CMP-0017",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-SUB-FAST-0020",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-SER-ORD-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D3-03",
    },
    {
      code: "GL-C3-SER-ORD-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D3-03",
    },
    {
      code: "GL-C3-SER-ORD-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D3-03",
    },
    {
      code: "GL-C3-SER-ORD-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D3-03",
    },
    {
      code: "GL-C5-DES-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
