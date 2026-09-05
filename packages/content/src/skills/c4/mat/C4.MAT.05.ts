import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_05_IDENTITY: SkillIdentity = {
  code: "C4.MAT.05",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Nước: lỏng · đá · hơi",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "predict"],
  tier: "core",
  prerequisites: ["C4.MAT.02", "C4.EXP.01"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.05-01",
      behaviour: "Nhận biết và thực hành Nước: lỏng · đá · hơi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.05-02",
      behaviour: "Vận dụng Nước: lỏng · đá · hơi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nước: lỏng · đá · hơi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_05_DATASET: SkillDataset = {
  skill_code: "C4.MAT.05",
  concept_label: "Nước: lỏng · đá · hơi",
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
      description: "Làm quen cơ bản với Nước: lỏng · đá · hơi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nước: lỏng · đá · hơi",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nước: lỏng · đá · hơi nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C4_MAT_05_SEED: SkillSeed = {
  identity: C4_MAT_05_IDENTITY,
  dataset: C4_MAT_05_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0008",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0009",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0010",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PAIR-0007",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PAIR-0008",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PATT-0007",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PATT-0008",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
  ],
};
