import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_02_IDENTITY: SkillIdentity = {
  code: "C2.DIR.02",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Đi xuống",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["plan"],
  tier: "basic",
  prerequisites: ["C2.ORI.04"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.02-01",
      behaviour: "Nhận biết và thực hành Đi xuống ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.02-02",
      behaviour: "Vận dụng Đi xuống trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đi xuống",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_02_DATASET: SkillDataset = {
  skill_code: "C2.DIR.02",
  concept_label: "Đi xuống",
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
      description: "Làm quen cơ bản với Đi xuống",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đi xuống",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đi xuống nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C2_DIR_02_SEED: SkillSeed = {
  identity: C2_DIR_02_IDENTITY,
  dataset: C2_DIR_02_DATASET,
  levels: [
    {
      code: "GL-C2-DIR-SHAD-0006",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0007",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0008",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0009",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0010",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-GRID-0006",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-GRID-0007",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-GRID-0008",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-GRID-0009",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-GRID-0010",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
