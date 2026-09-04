import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_04_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.04",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Nhiều ít",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.04", "C1.CMP.05"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.04-01",
      behaviour: "Nhận biết và thực hành Nhiều ít ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.04-02",
      behaviour: "Vận dụng Nhiều ít trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhiều ít",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_04_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.04",
  concept_label: "Nhiều ít",
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
      description: "Làm quen cơ bản với Nhiều ít",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhiều ít",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhiều ít nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C1_MEAS_04_SEED: SkillSeed = {
  identity: C1_MEAS_04_IDENTITY,
  dataset: C1_MEAS_04_DATASET,
  levels: [
    {
      code: "GL-C1-CLK-HND-0037",
      template: "GT-016",
      band: "5-6",
      difficulty: 2,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D5-08",
    },
    {
      code: "GL-C1-CLK-HND-0038",
      template: "GT-016",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D5-08",
    },
    {
      code: "GL-C1-CLK-HND-0039",
      template: "GT-016",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D5-08",
    },
    {
      code: "GL-C1-RUL-SLOT-0009",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D5-05",
    },
    {
      code: "GL-C1-RUL-SLOT-0010",
      template: "GT-008",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D5-05",
    },
    {
      code: "GL-C1-BAL-OBJ-0006",
      template: "GT-014",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D5-03",
    },
    {
      code: "GL-C1-BAL-OBJ-0007",
      template: "GT-014",
      band: "5-6",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D5-03",
    },
    {
      code: "GL-C1-BAL-OBJ-0008",
      template: "GT-014",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D5-03",
    },
    {
      code: "GL-C1-BAL-OBJ-0009",
      template: "GT-014",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D5-03",
    },
    {
      code: "GL-C1-BAL-OBJ-0010",
      template: "GT-014",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D5-03",
    },
  ],
};
