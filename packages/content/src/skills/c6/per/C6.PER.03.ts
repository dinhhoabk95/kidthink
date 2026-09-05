import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PER_03_IDENTITY: SkillIdentity = {
  code: "C6.PER.03",
  strand_code: "C6.PER",
  competency_code: "C6",
  name: "Làm xong rồi mới chơi tiếp",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["inhibit", "plan"],
  tier: "core",
  prerequisites: ["C6.PER.01"],
  learning_objectives: [
    {
      code: "LO-C6.PER.03-01",
      behaviour:
        "Nhận biết và thực hành Làm xong rồi mới chơi tiếp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PER.03-02",
      behaviour:
        "Vận dụng Làm xong rồi mới chơi tiếp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PER.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Làm xong rồi mới chơi tiếp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PER_03_DATASET: SkillDataset = {
  skill_code: "C6.PER.03",
  concept_label: "Làm xong rồi mới chơi tiếp",
  surface: "game",
  items: [
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
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Làm xong rồi mới chơi tiếp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Làm xong rồi mới chơi tiếp",
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
      "Chúng mình cùng tìm hiểu về Làm xong rồi mới chơi tiếp nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C6_PER_03_SEED: SkillSeed = {
  identity: C6_PER_03_IDENTITY,
  dataset: C6_PER_03_DATASET,
  levels: [
    {
      code: "GL-C6-PER-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-SHAD-0008",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-SHAD-0009",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-SIZE-0004",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-MAZE-0003",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-MAZE-0004",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-HIDE-0002",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
