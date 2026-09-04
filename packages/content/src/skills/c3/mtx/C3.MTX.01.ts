import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_MTX_01_IDENTITY: SkillIdentity = {
  code: "C3.MTX.01",
  strand_code: "C3.MTX",
  competency_code: "C3",
  name: "Ma trận 2×2",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.RULE.01"],
  learning_objectives: [
    {
      code: "LO-C3.MTX.01-01",
      behaviour: "Nhận biết và thực hành Ma trận 2×2 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.MTX.01-02",
      behaviour: "Vận dụng Ma trận 2×2 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.MTX.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ma trận 2×2",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_MTX_01_DATASET: SkillDataset = {
  skill_code: "C3.MTX.01",
  concept_label: "Ma trận 2×2",
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
      description: "Làm quen cơ bản với Ma trận 2×2",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ma trận 2×2",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ma trận 2×2 nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C3_MTX_01_SEED: SkillSeed = {
  identity: C3_MTX_01_IDENTITY,
  dataset: C3_MTX_01_DATASET,
  levels: [
    {
      code: "GL-C3-MTX-GRID-0001",
      template: "GT-017",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-MTX-GRID-0002",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-SUD-IMG-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D6-02",
    },
    {
      code: "GL-C3-SUD-IMG-0002",
      template: "GT-015",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D6-02",
    },
    {
      code: "GL-C3-SUD-IMG-0003",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D6-02",
    },
    {
      code: "GL-C3-SUD-IMG-0004",
      template: "GT-015",
      band: "5-6",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D6-02",
    },
    {
      code: "GL-C3-SUD-IMG-0005",
      template: "GT-015",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D6-02",
    },
  ],
};
