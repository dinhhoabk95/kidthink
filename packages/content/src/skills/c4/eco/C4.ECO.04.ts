import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_ECO_04_IDENTITY: SkillIdentity = {
  code: "C4.ECO.04",
  strand_code: "C4.ECO",
  competency_code: "C4",
  name: "Tiết kiệm nước và điện",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["plan", "inhibit"],
  tier: "core",
  prerequisites: ["C4.ECO.02"],
  learning_objectives: [
    {
      code: "LO-C4.ECO.04-01",
      behaviour: "Nhận biết và thực hành Tiết kiệm nước và điện ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.ECO.04-02",
      behaviour: "Vận dụng Tiết kiệm nước và điện trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.ECO.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tiết kiệm nước và điện",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_ECO_04_DATASET: SkillDataset = {
  skill_code: "C4.ECO.04",
  concept_label: "Tiết kiệm nước và điện",
  surface: "game",
  items: [
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
    {
      id: "dog",
      label: "con chó",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "cat",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "chicken",
      label: "con gà",
      image: {
        kind: "emoji",
        ref: "🐓",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "duck",
      label: "con vịt",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "động vật",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tiết kiệm nước và điện",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tiết kiệm nước và điện",
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
      "Chúng mình cùng tìm hiểu về Tiết kiệm nước và điện nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C4_ECO_04_SEED: SkillSeed = {
  identity: C4_ECO_04_IDENTITY,
  dataset: C4_ECO_04_DATASET,
  levels: [
    {
      code: "GL-C4-ECO-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SHAD-0003",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SHAD-0004",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SIZE-0004",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-MAZE-0003",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-MAZE-0004",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-HIDE-0003",
      template: "GT-015",
      band: "5-6",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-HIDE-0004",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
  ],
};
