import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_MIR_01_IDENTITY: SkillIdentity = {
  code: "C2.MIR.01",
  strand_code: "C2.MIR",
  competency_code: "C2",
  name: "Hình hai bên cân đối",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["observe", "predict"],
  tier: "core",
  prerequisites: ["C2.GEO.02"],
  learning_objectives: [
    {
      code: "LO-C2.MIR.01-01",
      behaviour: "Nhận biết và thực hành Đối xứng trục dọc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.MIR.01-02",
      behaviour: "Vận dụng Đối xứng trục dọc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.MIR.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đối xứng trục dọc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_MIR_01_DATASET: SkillDataset = {
  skill_code: "C2.MIR.01",
  concept_label: "Hình hai bên cân đối",
  surface: "game",
  items: [
    {
      id: "sym_butterfly",
      label: "con bướm hai cánh đều",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "hình cân đối",
      },
      contrast_group: "symmetric",
    },
    {
      id: "sym_snowflake",
      label: "bông tuyết đối xứng",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "❄️",
      },
      category: {
        type: "hình cân đối",
      },
      contrast_group: "symmetric",
    },
    {
      id: "sym_heart",
      label: "trái tim cân đối",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      category: {
        type: "hình cân đối",
      },
      contrast_group: "symmetric",
    },
    {
      id: "sym_star",
      label: "ngôi sao năm cánh",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "hình cân đối",
      },
      contrast_group: "symmetric",
    },
    {
      id: "asym_shoe",
      label: "chiếc giày lệch bên",
      value: 5,
      ordering: 5,
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
      label: "cây kéo nghiêng",
      value: 6,
      ordering: 6,
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
      label: "chiếc cốc có quai",
      value: 7,
      ordering: 7,
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
      label: "chú ốc sên xoắn",
      value: 8,
      ordering: 8,
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
        relation: "cùng cân đối",
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
      values: ["hình cân đối", "hình lệch bên"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với hình hai bên cân đối",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng hình hai bên cân đối",
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
      "Chúng mình cùng tìm hình hai bên cân đối giống nhau nhé",
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

export const C2_MIR_01_SEED: SkillSeed = {
  identity: C2_MIR_01_IDENTITY,
  dataset: C2_MIR_01_DATASET,
  levels: [
    {
      code: "GL-C2-FLI-SHP-0001",
      template: "GT-019",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-FLI-SHP-0002",
      template: "GT-019",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-FLI-SHP-0003",
      template: "GT-019",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-SYM-MIR-0001",
      template: "GT-021",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
  ],
};
