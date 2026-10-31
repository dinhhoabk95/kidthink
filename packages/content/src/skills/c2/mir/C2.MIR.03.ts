import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_MIR_03_IDENTITY: SkillIdentity = {
  code: "C2.MIR.03",
  strand_code: "C2.MIR",
  competency_code: "C2",
  name: "Hoàn thành nửa hình còn lại",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["create", "predict"],
  tier: "advanced",
  prerequisites: ["C2.MIR.01"],
  learning_objectives: [
    {
      code: "LO-C2.MIR.03-01",
      behaviour:
        "Nhận biết và thực hành Hoàn thành nửa hình còn lại ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.MIR.03-02",
      behaviour:
        "Vận dụng Hoàn thành nửa hình còn lại trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.MIR.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Hoàn thành nửa hình còn lại",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_MIR_03_DATASET: SkillDataset = {
  skill_code: "C2.MIR.03",
  concept_label: "Hoàn thành nửa hình còn lại",
  surface: "game",
  items: [
    {
      id: "sym_butterfly",
      label: "nửa bướm đối xứng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "nửa hình ghép",
      },
      contrast_group: "half_match",
    },
    {
      id: "sym_snowflake",
      label: "nửa bông tuyết",
      value: 2,
      image: {
        kind: "emoji",
        ref: "❄️",
      },
      category: {
        type: "nửa hình ghép",
      },
      contrast_group: "half_match",
    },
    {
      id: "sym_heart",
      label: "nửa trái tim",
      value: 3,
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      category: {
        type: "nửa hình ghép",
      },
      contrast_group: "half_match",
    },
    {
      id: "sym_star",
      label: "nửa ngôi sao",
      value: 4,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "nửa hình ghép",
      },
      contrast_group: "half_match",
    },
    {
      id: "asym_shoe",
      label: "chiếc giày lệch bên",
      value: 5,
      image: {
        kind: "emoji",
        ref: "👟",
      },
      category: {
        type: "hình lệch bên",
      },
      contrast_group: "asymmetric",
    },
    {
      id: "asym_scissors",
      label: "cây kéo lệch bên",
      value: 6,
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "hình lệch bên",
      },
      contrast_group: "asymmetric",
    },
    {
      id: "asym_cup",
      label: "chiếc cốc lệch bên",
      value: 7,
      image: {
        kind: "emoji",
        ref: "☕",
      },
      category: {
        type: "hình lệch bên",
      },
      contrast_group: "asymmetric",
    },
    {
      id: "asym_snail",
      label: "chú ốc sên lệch bên",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🐌",
      },
      category: {
        type: "hình lệch bên",
      },
      contrast_group: "asymmetric",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "sym_butterfly",
      target_id: "asym_shoe",
      metadata: {
        dimension: "symmetry",
      },
    },
    {
      type: "contrast",
      source_id: "sym_snowflake",
      target_id: "asym_scissors",
      metadata: {
        dimension: "symmetry",
      },
    },
    {
      type: "pair",
      source_id: "sym_butterfly",
      target_id: "sym_heart",
      metadata: {
        relation: "cùng nửa hình",
      },
    },
    {
      type: "pair",
      source_id: "asym_shoe",
      target_id: "asym_cup",
      metadata: {
        relation: "cùng lệch bên",
      },
    },
  ],
  axes: {
    symmetry: {
      values: ["nửa hình ghép", "hình lệch bên"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Hoàn thành nửa hình còn lại",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hoàn thành nửa hình còn lại",
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
      "Chúng mình cùng tìm hiểu về Hoàn thành nửa hình còn lại nhé",
  },
  ordering: [
    "sym_butterfly",
    "sym_snowflake",
    "sym_heart",
    "sym_star",
    "asym_shoe",
    "asym_scissors",
    "asym_cup",
    "asym_snail",
  ],
};

export const C2_MIR_03_SEED: SkillSeed = {
  identity: C2_MIR_03_IDENTITY,
  dataset: C2_MIR_03_DATASET,
  levels: [
    {
      code: "GL-C2-MIR-DOTS-0001",
      template: "GT-011",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-DOTS-0002",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-ISO-0001",
      template: "GT-017",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
