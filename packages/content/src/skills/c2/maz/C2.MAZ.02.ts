import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_MAZ_02_IDENTITY: SkillIdentity = {
  code: "C2.MAZ.02",
  strand_code: "C2.MAZ",
  competency_code: "C2",
  name: "Mê cung nhiều nhánh",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "deduce"],
  tier: "advanced",
  prerequisites: ["C2.MAZ.01"],
  learning_objectives: [
    {
      code: "LO-C2.MAZ.02-01",
      behaviour: "Nhận biết và thực hành Mê cung nhiều nhánh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.MAZ.02-02",
      behaviour: "Vận dụng Mê cung nhiều nhánh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.MAZ.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Mê cung nhiều nhánh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_MAZ_02_DATASET: SkillDataset = {
  skill_code: "C2.MAZ.02",
  concept_label: "Mê cung nhiều nhánh",
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
      description: "Làm quen cơ bản với Mê cung nhiều nhánh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Mê cung nhiều nhánh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Mê cung nhiều nhánh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C2_MAZ_02_SEED: SkillSeed = {
  identity: C2_MAZ_02_IDENTITY,
  dataset: C2_MAZ_02_DATASET,
  levels: [
    {
      code: "GL-C2-MAZ-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-SHAD-0006",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-HIDE-0002",
      template: "GT-015",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
