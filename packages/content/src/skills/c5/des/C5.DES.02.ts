import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DES_02_IDENTITY: SkillIdentity = {
  code: "C5.DES.02",
  strand_code: "C5.DES",
  competency_code: "C5",
  name: "Miêu tả một bức tranh",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["describe", "observe"],
  tier: "core",
  prerequisites: ["C5.DES.01"],
  learning_objectives: [
    {
      code: "LO-C5.DES.02-01",
      behaviour: "Nhận biết và thực hành Miêu tả một bức tranh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DES.02-02",
      behaviour: "Vận dụng Miêu tả một bức tranh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DES.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Miêu tả một bức tranh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DES_02_DATASET: SkillDataset = {
  skill_code: "C5.DES.02",
  concept_label: "Miêu tả một bức tranh",
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
      description: "Làm quen cơ bản với Miêu tả một bức tranh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Miêu tả một bức tranh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Miêu tả một bức tranh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C5_DES_02_SEED: SkillSeed = {
  identity: C5_DES_02_IDENTITY,
  dataset: C5_DES_02_DATASET,
  levels: [
    {
      code: "GL-C5-DES-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-PATT-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-PATT-0004",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
  ],
};
