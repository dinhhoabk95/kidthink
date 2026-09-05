import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_06_IDENTITY: SkillIdentity = {
  code: "C4.MAT.06",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Ánh sáng và bóng",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "predict"],
  tier: "core",
  prerequisites: ["C4.OBS.01", "C2.PER.01"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.06-01",
      behaviour: "Nhận biết và thực hành Ánh sáng và bóng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.06-02",
      behaviour: "Vận dụng Ánh sáng và bóng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ánh sáng và bóng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_06_DATASET: SkillDataset = {
  skill_code: "C4.MAT.06",
  concept_label: "Ánh sáng và bóng",
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
      description: "Làm quen cơ bản với Ánh sáng và bóng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ánh sáng và bóng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ánh sáng và bóng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C4_MAT_06_SEED: SkillSeed = {
  identity: C4_MAT_06_IDENTITY,
  dataset: C4_MAT_06_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0010",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0011",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0012",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PAIR-0009",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PAIR-0010",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PATT-0009",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PATT-0010",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
  ],
};
