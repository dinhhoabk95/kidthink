import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_01_IDENTITY: SkillIdentity = {
  code: "C5.WRT.01",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Cầm bút đúng",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "plan"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.WRT.01-01",
      behaviour: "Nhận biết và thực hành Cầm bút đúng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.01-02",
      behaviour: "Vận dụng Cầm bút đúng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cầm bút đúng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_01_DATASET: SkillDataset = {
  skill_code: "C5.WRT.01",
  concept_label: "Cầm bút đúng",
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
      description: "Làm quen cơ bản với Cầm bút đúng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Cầm bút đúng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Cầm bút đúng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C5_WRT_01_SEED: SkillSeed = {
  identity: C5_WRT_01_IDENTITY,
  dataset: C5_WRT_01_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
