import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ANA_03_IDENTITY: SkillIdentity = {
  code: "C3.ANA.03",
  strand_code: "C3.ANA",
  competency_code: "C3",
  name: "A : B = C : ?",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["infer", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.ANA.02"],
  learning_objectives: [
    {
      code: "LO-C3.ANA.03-01",
      behaviour: "Nhận biết và thực hành A : B = C : ? ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ANA.03-02",
      behaviour: "Vận dụng A : B = C : ? trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ANA.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới A : B = C : ?",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ANA_03_DATASET: SkillDataset = {
  skill_code: "C3.ANA.03",
  concept_label: "A : B = C : ?",
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
      description: "Làm quen cơ bản với A : B = C : ?",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng A : B = C : ?",
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
    narration_template: "Chúng mình cùng tìm hiểu về A : B = C : ? nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C3_ANA_03_SEED: SkillSeed = {
  identity: C3_ANA_03_IDENTITY,
  dataset: C3_ANA_03_DATASET,
  levels: [
    {
      code: "GL-C3-ODD-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D4-05",
    },
    {
      code: "GL-C3-ODD-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D4-05",
    },
    {
      code: "GL-C3-RLF-BSK-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
      legacy_v1_ref: "D4-08",
    },
    {
      code: "GL-C3-RLF-BSK-0010",
      template: "GT-003",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D4-08",
    },
  ],
};
