import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SOC_06_IDENTITY: SkillIdentity = {
  code: "C4.SOC.06",
  strand_code: "C4.SOC",
  competency_code: "C4",
  name: "Ai giúp ta trong cộng đồng",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["infer", "describe"],
  tier: "core",
  prerequisites: ["C4.SOC.04"],
  learning_objectives: [
    {
      code: "LO-C4.SOC.06-01",
      behaviour:
        "Nhận biết và thực hành Ai giúp ta trong cộng đồng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SOC.06-02",
      behaviour:
        "Vận dụng Ai giúp ta trong cộng đồng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SOC.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Ai giúp ta trong cộng đồng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SOC_06_DATASET: SkillDataset = {
  skill_code: "C4.SOC.06",
  concept_label: "Ai giúp ta trong cộng đồng",
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
      description: "Làm quen cơ bản với Ai giúp ta trong cộng đồng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ai giúp ta trong cộng đồng",
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
      "Chúng mình cùng tìm hiểu về Ai giúp ta trong cộng đồng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C4_SOC_06_SEED: SkillSeed = {
  identity: C4_SOC_06_IDENTITY,
  dataset: C4_SOC_06_DATASET,
  levels: [
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
