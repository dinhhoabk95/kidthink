import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PLN_01_IDENTITY: SkillIdentity = {
  code: "C6.PLN.01",
  strand_code: "C6.PLN",
  competency_code: "C6",
  name: "Lập kế hoạch trước khi làm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan"],
  tier: "advanced",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C6.PLN.01-01",
      behaviour:
        "Nhận biết và thực hành Lập kế hoạch trước khi làm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PLN.01-02",
      behaviour:
        "Vận dụng Lập kế hoạch trước khi làm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PLN.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Lập kế hoạch trước khi làm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PLN_01_DATASET: SkillDataset = {
  skill_code: "C6.PLN.01",
  concept_label: "Lập kế hoạch trước khi làm",
  surface: "game",
  items: [
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
    {
      id: "corn",
      label: "bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
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
      description: "Làm quen cơ bản với Lập kế hoạch trước khi làm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Lập kế hoạch trước khi làm",
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
      "Chúng mình cùng tìm hiểu về Lập kế hoạch trước khi làm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C6_PLN_01_SEED: SkillSeed = {
  identity: C6_PLN_01_IDENTITY,
  dataset: C6_PLN_01_DATASET,
  levels: [
    {
      code: "GL-C6-PLN-MAZE-0021",
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C6-PLN-MAZE-0022",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C6-PLN-MAZE-0023",
      template: "GT-013",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D6-01",
    },
    {
      code: "GL-C6-PLN-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SHAD-0001",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SHAD-0002",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-HIDE-0002",
      template: "GT-015",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
