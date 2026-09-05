import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INI_05_IDENTITY: SkillIdentity = {
  code: "C6.INI.05",
  strand_code: "C6.INI",
  competency_code: "C6",
  name: "Chọn công cụ phù hợp trước khi làm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "infer"],
  tier: "advanced",
  prerequisites: ["C6.INI.02", "C4.TOO.02"],
  learning_objectives: [
    {
      code: "LO-C6.INI.05-01",
      behaviour:
        "Nhận biết và thực hành Chọn công cụ phù hợp trước khi làm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INI.05-02",
      behaviour:
        "Vận dụng Chọn công cụ phù hợp trước khi làm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INI.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn công cụ phù hợp trước khi làm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INI_05_DATASET: SkillDataset = {
  skill_code: "C6.INI.05",
  concept_label: "Chọn công cụ phù hợp trước khi làm",
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
      description: "Làm quen cơ bản với Chọn công cụ phù hợp trước khi làm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn công cụ phù hợp trước khi làm",
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
      "Chúng mình cùng tìm hiểu về Chọn công cụ phù hợp trước khi làm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C6_INI_05_SEED: SkillSeed = {
  identity: C6_INI_05_IDENTITY,
  dataset: C6_INI_05_DATASET,
  levels: [
    {
      code: "GL-C6-INI-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SORT-0006",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SHAD-0010",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SHAD-0011",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SIZE-0005",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SIZE-0006",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
  ],
};
