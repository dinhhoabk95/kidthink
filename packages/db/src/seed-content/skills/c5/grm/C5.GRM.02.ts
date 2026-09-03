import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_GRM_02_IDENTITY: SkillIdentity = {
  code: "C5.GRM.02",
  strand_code: "C5.GRM",
  competency_code: "C5",
  name: "Trật tự từ trong câu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sequence", "verify"],
  tier: "advanced",
  prerequisites: ["C5.GRM.01", "C3.SEQ.01"],
  learning_objectives: [
    {
      code: "LO-C5.GRM.02-01",
      behaviour: "Nhận biết và thực hành Trật tự từ trong câu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.GRM.02-02",
      behaviour: "Vận dụng Trật tự từ trong câu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.GRM.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Trật tự từ trong câu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_GRM_02_DATASET: SkillDataset = {
  skill_code: "C5.GRM.02",
  concept_label: "Trật tự từ trong câu",
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
      description: "Làm quen cơ bản với Trật tự từ trong câu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trật tự từ trong câu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trật tự từ trong câu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C5_GRM_02_SEED: SkillSeed = {
  identity: C5_GRM_02_IDENTITY,
  dataset: C5_GRM_02_DATASET,
  levels: [
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
