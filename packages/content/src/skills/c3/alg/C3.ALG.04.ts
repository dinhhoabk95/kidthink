import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_04_IDENTITY: SkillIdentity = {
  code: "C3.ALG.04",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Nếu gặp … thì …",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["deduce", "plan"],
  tier: "advanced",
  prerequisites: ["C3.ALG.02", "C3.DED.02"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.04-01",
      behaviour: "Nhận biết và thực hành Nếu gặp … thì … ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.04-02",
      behaviour: "Vận dụng Nếu gặp … thì … trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nếu gặp … thì …",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_04_DATASET: SkillDataset = {
  skill_code: "C3.ALG.04",
  concept_label: "Nếu gặp … thì …",
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
      description: "Làm quen cơ bản với Nếu gặp … thì …",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nếu gặp … thì …",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nếu gặp … thì … nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C3_ALG_04_SEED: SkillSeed = {
  identity: C3_ALG_04_IDENTITY,
  dataset: C3_ALG_04_DATASET,
  levels: [
    {
      code: "GL-C3-ALG-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SORT-0006",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SHAD-0007",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SHAD-0008",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SIZE-0007",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SIZE-0008",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-MAZE-0005",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-MAZE-0006",
      template: "GT-013",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-HIDE-0002",
      template: "GT-015",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
