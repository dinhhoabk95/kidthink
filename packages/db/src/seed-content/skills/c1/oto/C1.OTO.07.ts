import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_OTO_07_IDENTITY: SkillIdentity = {
  code: "C1.OTO.07",
  strand_code: "C1.OTO",
  competency_code: "C1",
  name: "Ghép theo quy luật",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["match", "infer"],
  tier: "advanced",
  prerequisites: ["C1.OTO.01", "C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C1.OTO.07-01",
      behaviour: "Nhận biết và thực hành Ghép theo quy luật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.OTO.07-02",
      behaviour: "Vận dụng Ghép theo quy luật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.OTO.07-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép theo quy luật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_OTO_07_DATASET: SkillDataset = {
  skill_code: "C1.OTO.07",
  concept_label: "Ghép theo quy luật",
  surface: "game",
  items: [
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
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
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
      description: "Làm quen cơ bản với Ghép theo quy luật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghép theo quy luật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ghép theo quy luật nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C1_OTO_07_SEED: SkillSeed = {
  identity: C1_OTO_07_IDENTITY,
  dataset: C1_OTO_07_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
