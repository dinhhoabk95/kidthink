import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_01_IDENTITY: SkillIdentity = {
  code: "C3.ALG.01",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Làm theo chuỗi 2 lệnh",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sequence", "plan"],
  tier: "basic",
  prerequisites: ["C5.LIS.02"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.01-01",
      behaviour: "Nhận biết và thực hành Làm theo chuỗi 2 lệnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.01-02",
      behaviour: "Vận dụng Làm theo chuỗi 2 lệnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Làm theo chuỗi 2 lệnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_01_DATASET: SkillDataset = {
  skill_code: "C3.ALG.01",
  concept_label: "Làm theo chuỗi 2 lệnh",
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
      description: "Làm quen cơ bản với Làm theo chuỗi 2 lệnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Làm theo chuỗi 2 lệnh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Làm theo chuỗi 2 lệnh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C3_ALG_01_SEED: SkillSeed = {
  identity: C3_ALG_01_IDENTITY,
  dataset: C3_ALG_01_DATASET,
  levels: [
    {
      code: "GL-C3-ALG-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-BOND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-BOND-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
  ],
};
