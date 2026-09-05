import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRD_06_IDENTITY: SkillIdentity = {
  code: "C5.WRD.06",
  strand_code: "C5.WRD",
  competency_code: "C5",
  name: "Đọc câu ngắn ba tiếng",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["solve", "infer"],
  tier: "advanced",
  prerequisites: ["C5.WRD.05", "C5.PRN.04"],
  learning_objectives: [
    {
      code: "LO-C5.WRD.06-01",
      behaviour: "Nhận biết và thực hành Đọc câu ngắn ba tiếng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRD.06-02",
      behaviour: "Vận dụng Đọc câu ngắn ba tiếng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRD.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đọc câu ngắn ba tiếng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRD_06_DATASET: SkillDataset = {
  skill_code: "C5.WRD.06",
  concept_label: "Đọc câu ngắn ba tiếng",
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
      description: "Làm quen cơ bản với Đọc câu ngắn ba tiếng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc câu ngắn ba tiếng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đọc câu ngắn ba tiếng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C5_WRD_06_SEED: SkillSeed = {
  identity: C5_WRD_06_IDENTITY,
  dataset: C5_WRD_06_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-PAIR-0003",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-PAIR-0004",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SORT-0006",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SHAD-0001",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SHAD-0002",
      template: "GT-007",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SIZE-0003",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SIZE-0004",
      template: "GT-009",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-PUZZ-0001",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-PUZZ-0002",
      template: "GT-010",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
