import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_AUD_03_IDENTITY: SkillIdentity = {
  code: "C4.AUD.03",
  strand_code: "C4.AUD",
  competency_code: "C4",
  name: "Nhanh – chậm",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["listen", "compare"],
  tier: "basic",
  prerequisites: ["C4.AUD.01"],
  learning_objectives: [
    {
      code: "LO-C4.AUD.03-01",
      behaviour: "Nhận biết và thực hành Nhanh – chậm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.AUD.03-02",
      behaviour: "Vận dụng Nhanh – chậm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.AUD.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhanh – chậm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_AUD_03_DATASET: SkillDataset = {
  skill_code: "C4.AUD.03",
  concept_label: "Nhanh – chậm",
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
      description: "Làm quen cơ bản với Nhanh – chậm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhanh – chậm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhanh – chậm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C4_AUD_03_SEED: SkillSeed = {
  identity: C4_AUD_03_IDENTITY,
  dataset: C4_AUD_03_DATASET,
  levels: [
    {
      code: "GL-C4-AUD-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PATT-0007",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
