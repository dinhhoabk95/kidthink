import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_EXP_05_IDENTITY: SkillIdentity = {
  code: "C4.EXP.05",
  strand_code: "C4.EXP",
  competency_code: "C4",
  name: "So kết quả với dự đoán",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["verify", "compare"],
  tier: "advanced",
  prerequisites: ["C4.EXP.02"],
  learning_objectives: [
    {
      code: "LO-C4.EXP.05-01",
      behaviour: "Nhận biết và thực hành So kết quả với dự đoán ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.EXP.05-02",
      behaviour: "Vận dụng So kết quả với dự đoán trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.EXP.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới So kết quả với dự đoán",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_EXP_05_DATASET: SkillDataset = {
  skill_code: "C4.EXP.05",
  concept_label: "So kết quả với dự đoán",
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
      description: "Làm quen cơ bản với So kết quả với dự đoán",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng So kết quả với dự đoán",
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
      "Chúng mình cùng tìm hiểu về So kết quả với dự đoán nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C4_EXP_05_SEED: SkillSeed = {
  identity: C4_EXP_05_IDENTITY,
  dataset: C4_EXP_05_DATASET,
  levels: [
    {
      code: "GL-C4-EXP-TAP-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TAP-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-PATT-0001",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-PATT-0002",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
  ],
};
