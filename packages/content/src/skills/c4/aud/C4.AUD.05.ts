import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_AUD_05_IDENTITY: SkillIdentity = {
  code: "C4.AUD.05",
  strand_code: "C4.AUD",
  competency_code: "C4",
  name: "Cao – thấp",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "compare"],
  tier: "core",
  prerequisites: ["C4.AUD.01"],
  learning_objectives: [
    {
      code: "LO-C4.AUD.05-01",
      behaviour: "Nhận biết và thực hành Cao – thấp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.AUD.05-02",
      behaviour: "Vận dụng Cao – thấp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.AUD.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cao – thấp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_AUD_05_DATASET: SkillDataset = {
  skill_code: "C4.AUD.05",
  concept_label: "Cao – thấp",
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
      description: "Làm quen cơ bản với Cao – thấp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Cao – thấp",
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
    narration_template: "Chúng mình cùng tìm hiểu về Cao – thấp nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C4_AUD_05_SEED: SkillSeed = {
  identity: C4_AUD_05_IDENTITY,
  dataset: C4_AUD_05_DATASET,
  levels: [
    {
      code: "GL-C4-AUD-TAP-0010",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TAP-0011",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PATT-0010",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PATT-0011",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-SHAD-0005",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-SHAD-0006",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
  ],
};
