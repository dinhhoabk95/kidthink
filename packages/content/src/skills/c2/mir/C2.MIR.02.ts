import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_MIR_02_IDENTITY: SkillIdentity = {
  code: "C2.MIR.02",
  strand_code: "C2.MIR",
  competency_code: "C2",
  name: "Ảnh gương",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["predict", "infer"],
  tier: "advanced",
  prerequisites: ["C2.MIR.01"],
  learning_objectives: [
    {
      code: "LO-C2.MIR.02-01",
      behaviour: "Nhận biết và thực hành Ảnh gương ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.MIR.02-02",
      behaviour: "Vận dụng Ảnh gương trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.MIR.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ảnh gương",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_MIR_02_DATASET: SkillDataset = {
  skill_code: "C2.MIR.02",
  concept_label: "Ảnh gương",
  surface: "game",
  items: [
    {
      id: "mir_butterfly",
      label: "bướm soi gương",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "hình soi gương",
      },
      contrast_group: "mirror",
    },
    {
      id: "mir_flower",
      label: "hoa soi gương",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "hình soi gương",
      },
      contrast_group: "mirror",
    },
    {
      id: "mir_crown",
      label: "vương miện soi gương",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "👑",
      },
      category: {
        type: "hình soi gương",
      },
      contrast_group: "mirror",
    },
    {
      id: "mir_leaf",
      label: "lá cỏ soi gương",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "🍀",
      },
      category: {
        type: "hình soi gương",
      },
      contrast_group: "mirror",
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
      id: "asym_teapot",
      label: "ấm trà có vòi lệch",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "🫖",
      },
      category: {
        type: "hình lệch bên",
      },
      contrast_group: "asymmetric",
    },
    {
      id: "asym_guitar",
      label: "cây đàn cần dài",
      value: 7,
      ordering: 7,
      image: {
        kind: "emoji",
        ref: "🎸",
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
      source_id: "mir_butterfly",
      target_id: "asym_shoe",
      metadata: {
        dimension: "symmetry",
      },
    },
    {
      type: "contrast",
      source_id: "mir_flower",
      target_id: "asym_teapot",
      metadata: {
        dimension: "symmetry",
      },
    },
    {
      type: "pair",
      source_id: "mir_butterfly",
      target_id: "mir_crown",
      metadata: {
        relation: "cùng soi gương",
      },
    },
    {
      type: "pair",
      source_id: "asym_shoe",
      target_id: "asym_guitar",
      metadata: {
        relation: "cùng lệch bên",
      },
    },
  ],
  axes: {
    category: {
      values: ["hình soi gương", "hình lệch bên"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ảnh gương",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ảnh gương",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ảnh gương nhé",
  },
  ordering: [
    "mir_butterfly",
    "mir_flower",
    "mir_crown",
    "mir_leaf",
    "asym_shoe",
    "asym_teapot",
    "asym_guitar",
    "asym_snail",
  ],
};

export const C2_MIR_02_SEED: SkillSeed = {
  identity: C2_MIR_02_IDENTITY,
  dataset: C2_MIR_02_DATASET,
  levels: [
    {
      code: "GL-C2-FLI-SHP-0006",
      template: "GT-019",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-SYM-MIR-0006",
      template: "GT-021",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-SYM-MIR-0007",
      template: "GT-021",
      band: "5-6",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
  ],
};
