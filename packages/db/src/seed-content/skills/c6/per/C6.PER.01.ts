import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PER_01_IDENTITY: SkillIdentity = {
  code: "C6.PER.01",
  strand_code: "C6.PER",
  competency_code: "C6",
  name: "Làm hết nhiệm vụ",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["plan", "inhibit"],
  tier: "basic",
  prerequisites: ["C6.ATT.01"],
  learning_objectives: [
    {
      code: "LO-C6.PER.01-01",
      behaviour: "Nhận biết và thực hành Làm hết nhiệm vụ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PER.01-02",
      behaviour: "Vận dụng Làm hết nhiệm vụ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PER.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Làm hết nhiệm vụ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PER_01_DATASET: SkillDataset = {
  skill_code: "C6.PER.01",
  concept_label: "Làm hết nhiệm vụ",
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
      description: "Làm quen cơ bản với Làm hết nhiệm vụ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Làm hết nhiệm vụ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Làm hết nhiệm vụ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C6_PER_01_SEED: SkillSeed = {
  identity: C6_PER_01_IDENTITY,
  dataset: C6_PER_01_DATASET,
  levels: [
    {
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
