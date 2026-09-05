import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GRD_04_IDENTITY: SkillIdentity = {
  code: "C2.GRD.04",
  strand_code: "C2.GRD",
  competency_code: "C2",
  name: "Sơ đồ lưới của lớp học",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["infer", "plan"],
  tier: "advanced",
  prerequisites: ["C2.GRD.03", "C2.DIR.06"],
  learning_objectives: [
    {
      code: "LO-C2.GRD.04-01",
      behaviour: "Nhận biết và thực hành Sơ đồ lưới của lớp học ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GRD.04-02",
      behaviour: "Vận dụng Sơ đồ lưới của lớp học trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GRD.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Sơ đồ lưới của lớp học",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GRD_04_DATASET: SkillDataset = {
  skill_code: "C2.GRD.04",
  concept_label: "Sơ đồ lưới của lớp học",
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
      description: "Làm quen cơ bản với Sơ đồ lưới của lớp học",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Sơ đồ lưới của lớp học",
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
      "Chúng mình cùng tìm hiểu về Sơ đồ lưới của lớp học nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C2_GRD_04_SEED: SkillSeed = {
  identity: C2_GRD_04_IDENTITY,
  dataset: C2_GRD_04_DATASET,
  levels: [
    {
      code: "GL-C2-GRD-PAIR-0005",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-PAIR-0006",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SORT-0006",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SHAD-0003",
      template: "GT-007",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SHAD-0004",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SIZE-0003",
      template: "GT-009",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SIZE-0004",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-PUZZ-0001",
      template: "GT-010",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-PUZZ-0002",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
  ],
};
