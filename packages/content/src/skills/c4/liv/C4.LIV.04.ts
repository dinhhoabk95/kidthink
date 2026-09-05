import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_LIV_04_IDENTITY: SkillIdentity = {
  code: "C4.LIV.04",
  strand_code: "C4.LIV",
  competency_code: "C4",
  name: "Con vật ăn gì",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "infer"],
  tier: "basic",
  prerequisites: ["C4.LIV.02"],
  learning_objectives: [
    {
      code: "LO-C4.LIV.04-01",
      behaviour: "Nhận biết và thực hành Con vật ăn gì ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.LIV.04-02",
      behaviour: "Vận dụng Con vật ăn gì trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.LIV.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Con vật ăn gì",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_LIV_04_DATASET: SkillDataset = {
  skill_code: "C4.LIV.04",
  concept_label: "Con vật ăn gì",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Con vật ăn gì",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Con vật ăn gì",
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
    narration_template: "Chúng mình cùng tìm hiểu về Con vật ăn gì nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C4_LIV_04_SEED: SkillSeed = {
  identity: C4_LIV_04_IDENTITY,
  dataset: C4_LIV_04_DATASET,
  levels: [
    {
      code: "GL-C4-LIV-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCMP-0007",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCMP-0008",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
  ],
};
