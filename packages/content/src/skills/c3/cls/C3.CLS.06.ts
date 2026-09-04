import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_CLS_06_IDENTITY: SkillIdentity = {
  code: "C3.CLS.06",
  strand_code: "C3.CLS",
  competency_code: "C3",
  name: "Phân loại theo quy luật (đa thuộc tính)",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sort", "infer"],
  tier: "advanced",
  prerequisites: ["C3.CLS.01", "C3.CLS.02"],
  learning_objectives: [
    {
      code: "LO-C3.CLS.06-01",
      behaviour:
        "Nhận biết và thực hành Phân loại theo quy luật (đa thuộc tính) ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.CLS.06-02",
      behaviour:
        "Vận dụng Phân loại theo quy luật (đa thuộc tính) trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.CLS.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân loại theo quy luật (đa thuộc tính)",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_CLS_06_DATASET: SkillDataset = {
  skill_code: "C3.CLS.06",
  concept_label: "Phân loại theo quy luật (đa thuộc tính)",
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
      description:
        "Làm quen cơ bản với Phân loại theo quy luật (đa thuộc tính)",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Phân loại theo quy luật (đa thuộc tính)",
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
      "Chúng mình cùng tìm hiểu về Phân loại theo quy luật (đa thuộc tính) nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C3_CLS_06_SEED: SkillSeed = {
  identity: C3_CLS_06_IDENTITY,
  dataset: C3_CLS_06_DATASET,
  levels: [
    {
      code: "GL-C3-BLG-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D4-07",
    },
    {
      code: "GL-C3-BLG-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D4-07",
    },
    {
      code: "GL-C3-MUL-BSK-0001",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D4-04",
    },
    {
      code: "GL-C3-MUL-BSK-0002",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D4-04",
    },
  ],
};
