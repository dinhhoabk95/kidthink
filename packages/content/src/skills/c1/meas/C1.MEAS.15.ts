import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_15_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.15",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Sắp xếp trật tự kích thước",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sequence", "compare"],
  tier: "core",
  prerequisites: ["C1.MEAS.01"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.15-01",
      behaviour:
        "Nhận biết và thực hành Sắp xếp trật tự kích thước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.15-02",
      behaviour:
        "Vận dụng Sắp xếp trật tự kích thước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.15-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Sắp xếp trật tự kích thước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_15_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.15",
  concept_label: "Sắp xếp trật tự kích thước",
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
      description: "Làm quen cơ bản với Sắp xếp trật tự kích thước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Sắp xếp trật tự kích thước",
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
      "Chúng mình cùng tìm hiểu về Sắp xếp trật tự kích thước nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C1_MEAS_15_SEED: SkillSeed = {
  identity: C1_MEAS_15_IDENTITY,
  dataset: C1_MEAS_15_DATASET,
  levels: [
    {
      code: "GL-C1-COIN-CMP-0006",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D5-10",
    },
    {
      code: "GL-C1-COIN-CMP-0007",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D5-10",
    },
    {
      code: "GL-C1-COIN-CMP-0008",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D5-10",
    },
    {
      code: "GL-C1-COIN-CMP-0009",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D5-10",
    },
    {
      code: "GL-C1-COIN-CMP-0010",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D5-10",
    },
    {
      code: "GL-C1-CLK-TIM-0006",
      template: "GT-016",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D5-08",
    },
    {
      code: "GL-C1-CLK-TIM-0007",
      template: "GT-016",
      band: "5-6",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D5-08",
    },
    {
      code: "GL-C1-CLK-TIM-0008",
      template: "GT-016",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D5-08",
    },
    {
      code: "GL-C1-CLK-TIM-0009",
      template: "GT-016",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D5-08",
    },
    {
      code: "GL-C1-CLK-TIM-0010",
      template: "GT-016",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D5-08",
    },
  ],
};
