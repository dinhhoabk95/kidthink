import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRD_05_IDENTITY: SkillIdentity = {
  code: "C5.WRD.05",
  strand_code: "C5.WRD",
  competency_code: "C5",
  name: "Đọc từ hai tiếng",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["solve", "sequence"],
  tier: "advanced",
  prerequisites: ["C5.WRD.04"],
  learning_objectives: [
    {
      code: "LO-C5.WRD.05-01",
      behaviour: "Nhận biết và thực hành Đọc từ hai tiếng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRD.05-02",
      behaviour: "Vận dụng Đọc từ hai tiếng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRD.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đọc từ hai tiếng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRD_05_DATASET: SkillDataset = {
  skill_code: "C5.WRD.05",
  concept_label: "Đọc từ hai tiếng",
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
      description: "Làm quen cơ bản với Đọc từ hai tiếng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc từ hai tiếng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đọc từ hai tiếng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C5_WRD_05_SEED: SkillSeed = {
  identity: C5_WRD_05_IDENTITY,
  dataset: C5_WRD_05_DATASET,
  levels: [
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-008",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
  ],
};
