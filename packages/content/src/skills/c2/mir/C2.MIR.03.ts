import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_MIR_03_IDENTITY: SkillIdentity = {
  code: "C2.MIR.03",
  strand_code: "C2.MIR",
  competency_code: "C2",
  name: "Hoàn thành nửa hình còn lại",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["create", "predict"],
  tier: "advanced",
  prerequisites: ["C2.MIR.01"],
  learning_objectives: [
    {
      code: "LO-C2.MIR.03-01",
      behaviour:
        "Nhận biết và thực hành Hoàn thành nửa hình còn lại ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.MIR.03-02",
      behaviour:
        "Vận dụng Hoàn thành nửa hình còn lại trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.MIR.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Hoàn thành nửa hình còn lại",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_MIR_03_DATASET: SkillDataset = {
  skill_code: "C2.MIR.03",
  concept_label: "Hoàn thành nửa hình còn lại",
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
      description: "Làm quen cơ bản với Hoàn thành nửa hình còn lại",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hoàn thành nửa hình còn lại",
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
      "Chúng mình cùng tìm hiểu về Hoàn thành nửa hình còn lại nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C2_MIR_03_SEED: SkillSeed = {
  identity: C2_MIR_03_IDENTITY,
  dataset: C2_MIR_03_DATASET,
  levels: [
    {
      code: "GL-C2-MIR-DOTS-0001",
      template: "GT-011",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-DOTS-0002",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-DIFF-0001",
      template: "GT-014",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-DIFF-0002",
      template: "GT-014",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-ISO-0001",
      template: "GT-017",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-ISO-0002",
      template: "GT-017",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-TFRA-0001",
      template: "GT-019",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-TFRA-0002",
      template: "GT-019",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
  ],
};
