import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_DED_03_IDENTITY: SkillIdentity = {
  code: "C3.DED.03",
  strand_code: "C3.DED",
  competency_code: "C3",
  name: "Chọn đáp án đúng có giải thích",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["deduce", "describe"],
  tier: "advanced",
  prerequisites: ["C3.DED.01", "C3.DED.02"],
  learning_objectives: [
    {
      code: "LO-C3.DED.03-01",
      behaviour:
        "Nhận biết và thực hành Chọn đáp án đúng có giải thích ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.DED.03-02",
      behaviour:
        "Vận dụng Chọn đáp án đúng có giải thích trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.DED.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn đáp án đúng có giải thích",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_DED_03_DATASET: SkillDataset = {
  skill_code: "C3.DED.03",
  concept_label: "Chọn đáp án đúng có giải thích",
  surface: "worksheet",
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
      description: "Làm quen cơ bản với Chọn đáp án đúng có giải thích",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn đáp án đúng có giải thích",
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
      "Chúng mình cùng tìm hiểu về Chọn đáp án đúng có giải thích nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C3_DED_03_SEED: SkillSeed = {
  identity: C3_DED_03_IDENTITY,
  dataset: C3_DED_03_DATASET,
  levels: [
    {
      code: "GL-C3-DED-LOG-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D6-07",
    },
    {
      code: "GL-C3-DED-LOG-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D6-07",
    },
    {
      code: "GL-C3-DED-LOG-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D6-07",
    },
    {
      code: "GL-C3-DED-LOG-0004",
      template: "GT-009",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D6-07",
    },
    {
      code: "GL-C3-DED-LOG-0005",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D6-07",
    },
    {
      code: "GL-C3-DED-TAP-0002",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-TAP-0003",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-TAP-0004",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-TAP-0005",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-TAP-0006",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-TCNT-0006",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-TCNT-0007",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-TCNT-0008",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-TCNT-0009",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-TCNT-0010",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
