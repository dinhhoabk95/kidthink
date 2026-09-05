import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_DET_03_IDENTITY: SkillIdentity = {
  code: "C4.DET.03",
  strand_code: "C4.DET",
  competency_code: "C4",
  name: "Quan sát kích thước",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe", "compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.01"],
  learning_objectives: [
    {
      code: "LO-C4.DET.03-01",
      behaviour: "Nhận biết và thực hành Quan sát kích thước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.DET.03-02",
      behaviour: "Vận dụng Quan sát kích thước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.DET.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quan sát kích thước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_DET_03_DATASET: SkillDataset = {
  skill_code: "C4.DET.03",
  concept_label: "Quan sát kích thước",
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
      description: "Làm quen cơ bản với Quan sát kích thước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Quan sát kích thước",
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
    narration_template: "Chúng mình cùng tìm hiểu về Quan sát kích thước nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C4_DET_03_SEED: SkillSeed = {
  identity: C4_DET_03_IDENTITY,
  dataset: C4_DET_03_DATASET,
  levels: [
    {
      code: "GL-C4-DET-FIND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-FIND-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-SLOT-0005",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-SLOT-0006",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
  ],
};
