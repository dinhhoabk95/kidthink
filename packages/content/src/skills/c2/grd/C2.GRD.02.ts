import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GRD_02_IDENTITY: SkillIdentity = {
  code: "C2.GRD.02",
  strand_code: "C2.GRD",
  competency_code: "C2",
  name: "Đi theo ô",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["plan", "sequence"],
  tier: "core",
  prerequisites: ["C2.GRD.01", "C2.DIR.05"],
  learning_objectives: [
    {
      code: "LO-C2.GRD.02-01",
      behaviour: "Nhận biết và thực hành Đi theo ô ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GRD.02-02",
      behaviour: "Vận dụng Đi theo ô trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GRD.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đi theo ô",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GRD_02_DATASET: SkillDataset = {
  skill_code: "C2.GRD.02",
  concept_label: "Đi theo ô",
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
      description: "Làm quen cơ bản với Đi theo ô",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đi theo ô",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đi theo ô nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C2_GRD_02_SEED: SkillSeed = {
  identity: C2_GRD_02_IDENTITY,
  dataset: C2_GRD_02_DATASET,
  levels: [
    {
      code: "GL-C2-GRD-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SHAD-0001",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SHAD-0002",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SLOT-0002",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
  ],
};
