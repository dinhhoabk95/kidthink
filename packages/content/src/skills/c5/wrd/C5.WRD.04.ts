import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRD_04_IDENTITY: SkillIdentity = {
  code: "C5.WRD.04",
  strand_code: "C5.WRD",
  competency_code: "C5",
  name: "Đọc tiếng có dấu thanh",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["solve", "verify"],
  tier: "advanced",
  prerequisites: ["C5.WRD.03", "C5.TON.05"],
  learning_objectives: [
    {
      code: "LO-C5.WRD.04-01",
      behaviour: "Nhận biết và thực hành Đọc tiếng có dấu thanh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRD.04-02",
      behaviour: "Vận dụng Đọc tiếng có dấu thanh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRD.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đọc tiếng có dấu thanh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRD_04_DATASET: SkillDataset = {
  skill_code: "C5.WRD.04",
  concept_label: "Đọc tiếng có dấu thanh",
  surface: "game",
  items: [
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
    {
      id: "fish",
      label: "con cá",
      image: {
        kind: "emoji",
        ref: "🐟",
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
      description: "Làm quen cơ bản với Đọc tiếng có dấu thanh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc tiếng có dấu thanh",
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
      "Chúng mình cùng tìm hiểu về Đọc tiếng có dấu thanh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C5_WRD_04_SEED: SkillSeed = {
  identity: C5_WRD_04_IDENTITY,
  dataset: C5_WRD_04_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-MEAS-0001",
      template: "GT-028",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-MEAS-0002",
      template: "GT-028",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-TIME-0001",
      template: "GT-029",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-TIME-0002",
      template: "GT-029",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-COIN-0001",
      template: "GT-030",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-COIN-0002",
      template: "GT-030",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-PICT-0002",
      template: "GT-031",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-VENN-0001",
      template: "GT-032",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-VENN-0002",
      template: "GT-032",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
  ],
};
