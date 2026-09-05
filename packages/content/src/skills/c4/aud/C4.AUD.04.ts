import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_AUD_04_IDENTITY: SkillIdentity = {
  code: "C4.AUD.04",
  strand_code: "C4.AUD",
  competency_code: "C4",
  name: "Tiếng đồ vật quen thuộc",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["listen", "match"],
  tier: "basic",
  prerequisites: ["C4.AUD.02"],
  learning_objectives: [
    {
      code: "LO-C4.AUD.04-01",
      behaviour: "Nhận biết và thực hành Tiếng đồ vật quen thuộc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.AUD.04-02",
      behaviour: "Vận dụng Tiếng đồ vật quen thuộc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.AUD.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tiếng đồ vật quen thuộc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_AUD_04_DATASET: SkillDataset = {
  skill_code: "C4.AUD.04",
  concept_label: "Tiếng đồ vật quen thuộc",
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
      description: "Làm quen cơ bản với Tiếng đồ vật quen thuộc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tiếng đồ vật quen thuộc",
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
      "Chúng mình cùng tìm hiểu về Tiếng đồ vật quen thuộc nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C4_AUD_04_SEED: SkillSeed = {
  identity: C4_AUD_04_IDENTITY,
  dataset: C4_AUD_04_DATASET,
  levels: [
    {
      code: "GL-C4-AUD-TAP-0008",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TAP-0009",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PATT-0008",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PATT-0009",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-SLOT-0004",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
  ],
};
