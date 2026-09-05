import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_STO_04_IDENTITY: SkillIdentity = {
  code: "C5.STO.04",
  strand_code: "C5.STO",
  competency_code: "C5",
  name: "Nguyên nhân – kết quả trong truyện",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.INF.03"],
  learning_objectives: [
    {
      code: "LO-C5.STO.04-01",
      behaviour:
        "Nhận biết và thực hành Nguyên nhân – kết quả trong truyện ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.STO.04-02",
      behaviour:
        "Vận dụng Nguyên nhân – kết quả trong truyện trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.STO.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nguyên nhân – kết quả trong truyện",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_STO_04_DATASET: SkillDataset = {
  skill_code: "C5.STO.04",
  concept_label: "Nguyên nhân – kết quả trong truyện",
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
      description: "Làm quen cơ bản với Nguyên nhân – kết quả trong truyện",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nguyên nhân – kết quả trong truyện",
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
      "Chúng mình cùng tìm hiểu về Nguyên nhân – kết quả trong truyện nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C5_STO_04_SEED: SkillSeed = {
  identity: C5_STO_04_IDENTITY,
  dataset: C5_STO_04_DATASET,
  levels: [
    {
      code: "GL-C3-CAU-PAIR-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D6-03",
    },
    {
      code: "GL-C3-CAU-PAIR-0006",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D6-03",
    },
    {
      code: "GL-C3-CAU-PAIR-0007",
      template: "GT-005",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D6-03",
    },
    {
      code: "GL-C3-CAU-PAIR-0008",
      template: "GT-005",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D6-03",
    },
    {
      code: "GL-C5-STO-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SORT-0006",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SHAD-0006",
      template: "GT-007",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SIZE-0007",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SIZE-0008",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-PUZZ-0005",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-PUZZ-0006",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
