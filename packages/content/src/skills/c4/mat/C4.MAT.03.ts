import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_03_IDENTITY: SkillIdentity = {
  code: "C4.MAT.03",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Ngày và đêm",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "sequence"],
  tier: "basic",
  prerequisites: ["C1.MEAS.12"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.03-01",
      behaviour: "Nhận biết và thực hành Ngày và đêm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.03-02",
      behaviour: "Vận dụng Ngày và đêm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ngày và đêm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_03_DATASET: SkillDataset = {
  skill_code: "C4.MAT.03",
  concept_label: "Ngày và đêm",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ngày và đêm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ngày và đêm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ngày và đêm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C4_MAT_03_SEED: SkillSeed = {
  identity: C4_MAT_03_IDENTITY,
  dataset: C4_MAT_03_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
  ],
};
