import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_GRM_04_IDENTITY: SkillIdentity = {
  code: "C5.GRM.04",
  strand_code: "C5.GRM",
  competency_code: "C5",
  name: "Câu hỏi và câu kể",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "compare"],
  tier: "advanced",
  prerequisites: ["C5.QUE.02"],
  learning_objectives: [
    {
      code: "LO-C5.GRM.04-01",
      behaviour: "Nhận biết và thực hành Câu hỏi và câu kể ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.GRM.04-02",
      behaviour: "Vận dụng Câu hỏi và câu kể trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.GRM.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Câu hỏi và câu kể",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_GRM_04_DATASET: SkillDataset = {
  skill_code: "C5.GRM.04",
  concept_label: "Câu hỏi và câu kể",
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
      description: "Làm quen cơ bản với Câu hỏi và câu kể",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Câu hỏi và câu kể",
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
    narration_template: "Chúng mình cùng tìm hiểu về Câu hỏi và câu kể nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C5_GRM_04_SEED: SkillSeed = {
  identity: C5_GRM_04_IDENTITY,
  dataset: C5_GRM_04_DATASET,
  levels: [
    {
      code: "GL-C5-GRM-TAP-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-TAP-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-PATT-0001",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-PATT-0002",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SORT-0006",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
  ],
};
