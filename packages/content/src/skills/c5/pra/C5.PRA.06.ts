import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRA_06_IDENTITY: SkillIdentity = {
  code: "C5.PRA.06",
  strand_code: "C5.PRA",
  competency_code: "C5",
  name: "Nói ý kiến kèm lý do",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["describe", "deduce"],
  tier: "advanced",
  prerequisites: ["C5.DES.04"],
  learning_objectives: [
    {
      code: "LO-C5.PRA.06-01",
      behaviour: "Nhận biết và thực hành Nói ý kiến kèm lý do ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRA.06-02",
      behaviour: "Vận dụng Nói ý kiến kèm lý do trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRA.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nói ý kiến kèm lý do",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRA_06_DATASET: SkillDataset = {
  skill_code: "C5.PRA.06",
  concept_label: "Nói ý kiến kèm lý do",
  surface: "worksheet",
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
      description: "Làm quen cơ bản với Nói ý kiến kèm lý do",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nói ý kiến kèm lý do",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nói ý kiến kèm lý do nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C5_PRA_06_SEED: SkillSeed = {
  identity: C5_PRA_06_IDENTITY,
  dataset: C5_PRA_06_DATASET,
  levels: [
    {
      code: "GL-C5-PRA-TAP-0006",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TAP-0007",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TCNT-0006",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TCNT-0007",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TCNT-0008",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TCNT-0009",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TCNT-0010",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
