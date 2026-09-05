import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TOO_02_IDENTITY: SkillIdentity = {
  code: "C4.TOO.02",
  strand_code: "C4.TOO",
  competency_code: "C4",
  name: "Chọn công cụ đúng việc",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["infer", "plan"],
  tier: "core",
  prerequisites: ["C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C4.TOO.02-01",
      behaviour: "Nhận biết và thực hành Chọn công cụ đúng việc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TOO.02-02",
      behaviour: "Vận dụng Chọn công cụ đúng việc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TOO.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn công cụ đúng việc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TOO_02_DATASET: SkillDataset = {
  skill_code: "C4.TOO.02",
  concept_label: "Chọn công cụ đúng việc",
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
      description: "Làm quen cơ bản với Chọn công cụ đúng việc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn công cụ đúng việc",
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
      "Chúng mình cùng tìm hiểu về Chọn công cụ đúng việc nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C4_TOO_02_SEED: SkillSeed = {
  identity: C4_TOO_02_IDENTITY,
  dataset: C4_TOO_02_DATASET,
  levels: [
    {
      code: "GL-C4-TOO-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SIZE-0004",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-MAZE-0003",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-MAZE-0004",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
  ],
};
