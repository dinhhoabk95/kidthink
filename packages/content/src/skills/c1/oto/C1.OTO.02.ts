import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_OTO_02_IDENTITY: SkillIdentity = {
  code: "C1.OTO.02",
  strand_code: "C1.OTO",
  competency_code: "C1",
  name: "Ghép nhiều với một",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["match", "infer"],
  tier: "core",
  prerequisites: ["C1.OTO.01"],
  learning_objectives: [
    {
      code: "LO-C1.OTO.02-01",
      behaviour: "Nhận biết và thực hành Ghép nhiều với một ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.OTO.02-02",
      behaviour: "Vận dụng Ghép nhiều với một trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.OTO.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép nhiều với một",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_OTO_02_DATASET: SkillDataset = {
  skill_code: "C1.OTO.02",
  concept_label: "Ghép nhiều với một",
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
      description: "Làm quen cơ bản với Ghép nhiều với một",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghép nhiều với một",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ghép nhiều với một nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C1_OTO_02_SEED: SkillSeed = {
  identity: C1_OTO_02_IDENTITY,
  dataset: C1_OTO_02_DATASET,
  levels: [
    {
      code: "GL-C1-OTO-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TAP-0008",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0007",
      template: "GT-003",
      band: "3-4",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0008",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0007",
      template: "GT-005",
      band: "3-4",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0008",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
  ],
};
