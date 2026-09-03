import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_INF_01_IDENTITY: SkillIdentity = {
  code: "C3.INF.01",
  strand_code: "C3.INF",
  competency_code: "C3",
  name: "Đoán vật còn thiếu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["infer"],
  tier: "core",
  prerequisites: ["C3.ANA.01"],
  learning_objectives: [
    {
      code: "LO-C3.INF.01-01",
      behaviour: "Nhận biết và thực hành Đoán vật còn thiếu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.INF.01-02",
      behaviour: "Vận dụng Đoán vật còn thiếu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.INF.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đoán vật còn thiếu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_INF_01_DATASET: SkillDataset = {
  skill_code: "C3.INF.01",
  concept_label: "Đoán vật còn thiếu",
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
      description: "Làm quen cơ bản với Đoán vật còn thiếu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đoán vật còn thiếu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đoán vật còn thiếu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C3_INF_01_SEED: SkillSeed = {
  identity: C3_INF_01_IDENTITY,
  dataset: C3_INF_01_DATASET,
  levels: [
    {
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
