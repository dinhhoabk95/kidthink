import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SEQ_01_IDENTITY: SkillIdentity = {
  code: "C3.SEQ.01",
  strand_code: "C3.SEQ",
  competency_code: "C3",
  name: "Chuỗi hình",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["sequence", "predict"],
  tier: "basic",
  prerequisites: ["C1.PAT.09"],
  learning_objectives: [
    {
      code: "LO-C3.SEQ.01-01",
      behaviour: "Nhận biết và thực hành Chuỗi hình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SEQ.01-02",
      behaviour: "Vận dụng Chuỗi hình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SEQ.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chuỗi hình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SEQ_01_DATASET: SkillDataset = {
  skill_code: "C3.SEQ.01",
  concept_label: "Chuỗi hình",
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
      description: "Làm quen cơ bản với Chuỗi hình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chuỗi hình",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chuỗi hình nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C3_SEQ_01_SEED: SkillSeed = {
  identity: C3_SEQ_01_IDENTITY,
  dataset: C3_SEQ_01_DATASET,
  levels: [
    {
      code: "GL-C3-PAT-CARD-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-PAT-CARD-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-PAT-SEQ-0006",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-PAT-SEQ-0007",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-PAT-SEQ-0012",
      template: "GT-011",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-SUB-FAST-0013",
      template: "GT-012",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-PAT-SEQ-0016",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-MAT-CHO-0024",
      template: "GT-011",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-MAT-CHO-0025",
      template: "GT-011",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-MAT-CHO-0026",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-VIS-SPOT-0030",
      template: "GT-025",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-MUL-BSK-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
      legacy_v1_ref: "D4-04",
    },
    {
      code: "GL-C3-MUL-BSK-0010",
      template: "GT-003",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D4-04",
    },
    {
      code: "GL-C3-SEQ-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
  ],
};
