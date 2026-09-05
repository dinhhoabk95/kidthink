import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_PER_04_IDENTITY: SkillIdentity = {
  code: "C2.PER.04",
  strand_code: "C2.PER",
  competency_code: "C2",
  name: "Nhìn từ bên cạnh",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "predict"],
  tier: "advanced",
  prerequisites: ["C2.PER.01"],
  learning_objectives: [
    {
      code: "LO-C2.PER.04-01",
      behaviour: "Nhận biết và thực hành Nhìn từ bên cạnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.PER.04-02",
      behaviour: "Vận dụng Nhìn từ bên cạnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.PER.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhìn từ bên cạnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_PER_04_DATASET: SkillDataset = {
  skill_code: "C2.PER.04",
  concept_label: "Nhìn từ bên cạnh",
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
      description: "Làm quen cơ bản với Nhìn từ bên cạnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhìn từ bên cạnh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhìn từ bên cạnh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C2_PER_04_SEED: SkillSeed = {
  identity: C2_PER_04_IDENTITY,
  dataset: C2_PER_04_DATASET,
  levels: [
    {
      code: "GL-C2-PER-PAIR-0007",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-PAIR-0008",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-SORT-0006",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-SHAD-0006",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-SIZE-0005",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-SIZE-0006",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-PUZZ-0005",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-PUZZ-0006",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
  ],
};
