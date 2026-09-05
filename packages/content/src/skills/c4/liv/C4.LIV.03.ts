import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_LIV_03_IDENTITY: SkillIdentity = {
  code: "C4.LIV.03",
  strand_code: "C4.LIV",
  competency_code: "C4",
  name: "Sống – không sống",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sort", "infer"],
  tier: "core",
  prerequisites: ["C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C4.LIV.03-01",
      behaviour: "Nhận biết và thực hành Sống – không sống ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.LIV.03-02",
      behaviour: "Vận dụng Sống – không sống trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.LIV.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Sống – không sống",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_LIV_03_DATASET: SkillDataset = {
  skill_code: "C4.LIV.03",
  concept_label: "Sống – không sống",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Sống – không sống",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Sống – không sống",
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
    narration_template: "Chúng mình cùng tìm hiểu về Sống – không sống nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C4_LIV_03_SEED: SkillSeed = {
  identity: C4_LIV_03_IDENTITY,
  dataset: C4_LIV_03_DATASET,
  levels: [
    {
      code: "GL-C4-LIV-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-SLOT-0005",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-SLOT-0006",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
