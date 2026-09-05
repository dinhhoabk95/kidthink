import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SEN_02_IDENTITY: SkillIdentity = {
  code: "C4.SEN.02",
  strand_code: "C4.SEN",
  competency_code: "C4",
  name: "Phân biệt hình gần giống",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: ["C4.DET.02"],
  learning_objectives: [
    {
      code: "LO-C4.SEN.02-01",
      behaviour: "Nhận biết và thực hành Phân biệt hình gần giống ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SEN.02-02",
      behaviour: "Vận dụng Phân biệt hình gần giống trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SEN.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân biệt hình gần giống",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SEN_02_DATASET: SkillDataset = {
  skill_code: "C4.SEN.02",
  concept_label: "Phân biệt hình gần giống",
  surface: "game",
  items: [
    {
      id: "bowl",
      label: "cái bát",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ dùng",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Phân biệt hình gần giống",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân biệt hình gần giống",
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
    narration_template:
      "Chúng mình cùng tìm hiểu về Phân biệt hình gần giống nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C4_SEN_02_SEED: SkillSeed = {
  identity: C4_SEN_02_IDENTITY,
  dataset: C4_SEN_02_DATASET,
  levels: [
    {
      code: "GL-C4-SEN-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PATT-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-PATT-0004",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
