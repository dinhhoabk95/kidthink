import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRA_05_IDENTITY: SkillIdentity = {
  code: "C5.PRA.05",
  strand_code: "C5.PRA",
  competency_code: "C5",
  name: "Kể lại cho người vắng mặt",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["recall", "describe"],
  tier: "advanced",
  prerequisites: ["C5.STO.01", "C5.PRA.03"],
  learning_objectives: [
    {
      code: "LO-C5.PRA.05-01",
      behaviour:
        "Nhận biết và thực hành Kể lại cho người vắng mặt ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRA.05-02",
      behaviour:
        "Vận dụng Kể lại cho người vắng mặt trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRA.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Kể lại cho người vắng mặt",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRA_05_DATASET: SkillDataset = {
  skill_code: "C5.PRA.05",
  concept_label: "Kể lại cho người vắng mặt",
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
      description: "Làm quen cơ bản với Kể lại cho người vắng mặt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Kể lại cho người vắng mặt",
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
      "Chúng mình cùng tìm hiểu về Kể lại cho người vắng mặt nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C5_PRA_05_SEED: SkillSeed = {
  identity: C5_PRA_05_IDENTITY,
  dataset: C5_PRA_05_DATASET,
  levels: [
    {
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
