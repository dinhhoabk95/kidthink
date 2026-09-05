import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_02_IDENTITY: SkillIdentity = {
  code: "C3.ALG.02",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Làm theo chuỗi 3–4 lệnh",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["sequence", "plan"],
  tier: "core",
  prerequisites: ["C3.ALG.01"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.02-01",
      behaviour: "Nhận biết và thực hành Làm theo chuỗi 3–4 lệnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.02-02",
      behaviour: "Vận dụng Làm theo chuỗi 3–4 lệnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Làm theo chuỗi 3–4 lệnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_02_DATASET: SkillDataset = {
  skill_code: "C3.ALG.02",
  concept_label: "Làm theo chuỗi 3–4 lệnh",
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
      description: "Làm quen cơ bản với Làm theo chuỗi 3–4 lệnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Làm theo chuỗi 3–4 lệnh",
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
      "Chúng mình cùng tìm hiểu về Làm theo chuỗi 3–4 lệnh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C3_ALG_02_SEED: SkillSeed = {
  identity: C3_ALG_02_IDENTITY,
  dataset: C3_ALG_02_DATASET,
  levels: [
    {
      code: "GL-C3-ALG-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SHAD-0003",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SHAD-0004",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SLOT-0003",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SIZE-0004",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-MAZE-0003",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-MAZE-0004",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
  ],
};
