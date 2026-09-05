import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GRD_05_IDENTITY: SkillIdentity = {
  code: "C2.GRD.05",
  strand_code: "C2.GRD",
  competency_code: "C2",
  name: "Ghi lại đường đi bằng ô",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["plan", "create"],
  tier: "advanced",
  prerequisites: ["C2.GRD.02", "C2.GRD.03"],
  learning_objectives: [
    {
      code: "LO-C2.GRD.05-01",
      behaviour: "Nhận biết và thực hành Ghi lại đường đi bằng ô ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GRD.05-02",
      behaviour: "Vận dụng Ghi lại đường đi bằng ô trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GRD.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Ghi lại đường đi bằng ô",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GRD_05_DATASET: SkillDataset = {
  skill_code: "C2.GRD.05",
  concept_label: "Ghi lại đường đi bằng ô",
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
      description: "Làm quen cơ bản với Ghi lại đường đi bằng ô",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghi lại đường đi bằng ô",
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
      "Chúng mình cùng tìm hiểu về Ghi lại đường đi bằng ô nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C2_GRD_05_SEED: SkillSeed = {
  identity: C2_GRD_05_IDENTITY,
  dataset: C2_GRD_05_DATASET,
  levels: [
    {
      code: "GL-C2-GRD-SORT-0007",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SORT-0008",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SHAD-0005",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SHAD-0006",
      template: "GT-007",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SIZE-0005",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SIZE-0006",
      template: "GT-009",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-MAZE-0003",
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-MAZE-0004",
      template: "GT-013",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-HIDE-0002",
      template: "GT-015",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
