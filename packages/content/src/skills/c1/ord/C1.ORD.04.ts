import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ORD_04_IDENTITY: SkillIdentity = {
  code: "C1.ORD.04",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Thứ tự đến thứ mười",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["sequence", "count"],
  tier: "core",
  prerequisites: ["C1.ORD.03", "C1.NREC.03"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.04-01",
      behaviour: "Nhận biết và thực hành Thứ tự đến thứ mười ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.04-02",
      behaviour: "Vận dụng Thứ tự đến thứ mười trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thứ tự đến thứ mười",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_04_DATASET: SkillDataset = {
  skill_code: "C1.ORD.04",
  concept_label: "Thứ tự đến thứ mười",
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
      description: "Làm quen cơ bản với Thứ tự đến thứ mười",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thứ tự đến thứ mười",
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
    narration_template: "Chúng mình cùng tìm hiểu về Thứ tự đến thứ mười nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C1_ORD_04_SEED: SkillSeed = {
  identity: C1_ORD_04_IDENTITY,
  dataset: C1_ORD_04_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-TAP-0013",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0014",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0015",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0016",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0013",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0014",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0015",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0016",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0013",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0014",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0015",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0016",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0009",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0010",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0011",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SHAD-0012",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
  ],
};
