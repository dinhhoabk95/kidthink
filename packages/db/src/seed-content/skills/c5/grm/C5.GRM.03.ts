import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_GRM_03_IDENTITY: SkillIdentity = {
  code: "C5.GRM.03",
  strand_code: "C5.GRM",
  competency_code: "C5",
  name: "Từ nối: và · rồi · nhưng · vì",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["describe", "infer"],
  tier: "advanced",
  prerequisites: ["C5.GRM.01"],
  learning_objectives: [
    {
      code: "LO-C5.GRM.03-01",
      behaviour:
        "Nhận biết và thực hành Từ nối: và · rồi · nhưng · vì ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.GRM.03-02",
      behaviour:
        "Vận dụng Từ nối: và · rồi · nhưng · vì trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.GRM.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Từ nối: và · rồi · nhưng · vì",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_GRM_03_DATASET: SkillDataset = {
  skill_code: "C5.GRM.03",
  concept_label: "Từ nối: và · rồi · nhưng · vì",
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
      description: "Làm quen cơ bản với Từ nối: và · rồi · nhưng · vì",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ nối: và · rồi · nhưng · vì",
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
      "Chúng mình cùng tìm hiểu về Từ nối: và · rồi · nhưng · vì nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C5_GRM_03_SEED: SkillSeed = {
  identity: C5_GRM_03_IDENTITY,
  dataset: C5_GRM_03_DATASET,
  levels: [
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
