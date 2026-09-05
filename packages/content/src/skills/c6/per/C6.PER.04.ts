import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PER_04_IDENTITY: SkillIdentity = {
  code: "C6.PER.04",
  strand_code: "C6.PER",
  competency_code: "C6",
  name: "Chọn việc khó hơn",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "compare"],
  tier: "advanced",
  prerequisites: ["C6.PER.02"],
  learning_objectives: [
    {
      code: "LO-C6.PER.04-01",
      behaviour: "Nhận biết và thực hành Chọn việc khó hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PER.04-02",
      behaviour: "Vận dụng Chọn việc khó hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PER.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chọn việc khó hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PER_04_DATASET: SkillDataset = {
  skill_code: "C6.PER.04",
  concept_label: "Chọn việc khó hơn",
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
      description: "Làm quen cơ bản với Chọn việc khó hơn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn việc khó hơn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chọn việc khó hơn nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C6_PER_04_SEED: SkillSeed = {
  identity: C6_PER_04_IDENTITY,
  dataset: C6_PER_04_DATASET,
  levels: [
    {
      code: "GL-C6-PER-TAP-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-TAP-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-PATT-0001",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-PATT-0002",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
