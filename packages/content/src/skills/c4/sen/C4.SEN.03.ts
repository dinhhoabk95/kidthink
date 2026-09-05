import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SEN_03_IDENTITY: SkillIdentity = {
  code: "C4.SEN.03",
  strand_code: "C4.SEN",
  competency_code: "C4",
  name: "Phân biệt kết cấu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.SEN.03-01",
      behaviour: "Nhận biết và thực hành Phân biệt kết cấu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SEN.03-02",
      behaviour: "Vận dụng Phân biệt kết cấu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SEN.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Phân biệt kết cấu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SEN_03_DATASET: SkillDataset = {
  skill_code: "C4.SEN.03",
  concept_label: "Phân biệt kết cấu",
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
      description: "Làm quen cơ bản với Phân biệt kết cấu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân biệt kết cấu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Phân biệt kết cấu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C4_SEN_03_SEED: SkillSeed = {
  identity: C4_SEN_03_IDENTITY,
  dataset: C4_SEN_03_DATASET,
  levels: [
    {
      code: "GL-C4-SEN-SND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-SND-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
  ],
};
