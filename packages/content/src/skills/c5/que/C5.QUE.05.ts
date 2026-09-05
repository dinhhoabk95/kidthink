import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_QUE_05_IDENTITY: SkillIdentity = {
  code: "C5.QUE.05",
  strand_code: "C5.QUE",
  competency_code: "C5",
  name: 'Trả lời "Tại sao?"',
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "deduce"],
  tier: "advanced",
  prerequisites: ["C5.QUE.02", "C3.INF.03"],
  learning_objectives: [
    {
      code: "LO-C5.QUE.05-01",
      behaviour: 'Nhận biết và thực hành Trả lời "Tại sao?" ở mức cơ bản',
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.QUE.05-02",
      behaviour: 'Vận dụng Trả lời "Tại sao?" trong môi trường tương tác',
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.QUE.05-03",
      behaviour: 'Giải quyết vấn đề nâng cao liên quan tới Trả lời "Tại sao?"',
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_QUE_05_DATASET: SkillDataset = {
  skill_code: "C5.QUE.05",
  concept_label: 'Trả lời "Tại sao?"',
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
      description: 'Làm quen cơ bản với Trả lời "Tại sao?"',
    },
    {
      rung: 2,
      dimension: "range",
      description: 'Nhận biết và chọn đúng Trả lời "Tại sao?"',
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
    narration_template: 'Chúng mình cùng tìm hiểu về Trả lời "Tại sao?" nhé',
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C5_QUE_05_SEED: SkillSeed = {
  identity: C5_QUE_05_IDENTITY,
  dataset: C5_QUE_05_DATASET,
  levels: [
    {
      code: "GL-C5-QUE-FRAC-0001",
      template: "GT-034",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-FRAC-0002",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-FRAC-0003",
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-FRAC-0004",
      template: "GT-034",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-FRAC-0005",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0011",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0012",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0013",
      template: "GT-001",
      band: "4-5",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0014",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0015",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
  ],
};
