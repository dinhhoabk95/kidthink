import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_CAU_05_IDENTITY: SkillIdentity = {
  code: "C4.CAU.05",
  strand_code: "C4.CAU",
  competency_code: "C4",
  name: "Chuỗi nhân quả hai bước",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["infer", "sequence"],
  tier: "advanced",
  prerequisites: ["C4.CAU.04"],
  learning_objectives: [
    {
      code: "LO-C4.CAU.05-01",
      behaviour: "Nhận biết và thực hành Chuỗi nhân quả hai bước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.CAU.05-02",
      behaviour: "Vận dụng Chuỗi nhân quả hai bước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.CAU.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chuỗi nhân quả hai bước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_CAU_05_DATASET: SkillDataset = {
  skill_code: "C4.CAU.05",
  concept_label: "Chuỗi nhân quả hai bước",
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
      description: "Làm quen cơ bản với Chuỗi nhân quả hai bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chuỗi nhân quả hai bước",
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
      "Chúng mình cùng tìm hiểu về Chuỗi nhân quả hai bước nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C4_CAU_05_SEED: SkillSeed = {
  identity: C4_CAU_05_IDENTITY,
  dataset: C4_CAU_05_DATASET,
  levels: [
    {
      code: "GL-C4-CAU-PAIR-0009",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-PAIR-0010",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SORT-0006",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SHAD-0009",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SHAD-0010",
      template: "GT-007",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SLOT-0001",
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SLOT-0002",
      template: "GT-008",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SIZE-0009",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SIZE-0010",
      template: "GT-009",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
  ],
};
