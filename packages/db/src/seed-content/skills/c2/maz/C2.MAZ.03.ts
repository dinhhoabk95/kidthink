import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_MAZ_03_IDENTITY: SkillIdentity = {
  code: "C2.MAZ.03",
  strand_code: "C2.MAZ",
  competency_code: "C2",
  name: "Tìm đường ngắn nhất",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["plan", "compare"],
  tier: "advanced",
  prerequisites: ["C2.MAZ.02", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C2.MAZ.03-01",
      behaviour: "Nhận biết và thực hành Tìm đường ngắn nhất ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.MAZ.03-02",
      behaviour: "Vận dụng Tìm đường ngắn nhất trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.MAZ.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tìm đường ngắn nhất",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_MAZ_03_DATASET: SkillDataset = {
  skill_code: "C2.MAZ.03",
  concept_label: "Tìm đường ngắn nhất",
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
      description: "Làm quen cơ bản với Tìm đường ngắn nhất",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm đường ngắn nhất",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tìm đường ngắn nhất nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C2_MAZ_03_SEED: SkillSeed = {
  identity: C2_MAZ_03_IDENTITY,
  dataset: C2_MAZ_03_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
  ],
};
