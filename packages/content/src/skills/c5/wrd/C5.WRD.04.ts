import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRD_04_IDENTITY: SkillIdentity = {
  code: "C5.WRD.04",
  strand_code: "C5.WRD",
  competency_code: "C5",
  name: "Đọc tiếng có dấu thanh",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["solve", "verify"],
  tier: "advanced",
  prerequisites: ["C5.WRD.03", "C5.TON.05", "C5.TMK.03"],
  learning_objectives: [
    {
      code: "LO-C5.WRD.04-01",
      behaviour: "Nhận biết và thực hành Đọc tiếng có dấu thanh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRD.04-02",
      behaviour: "Vận dụng Đọc tiếng có dấu thanh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRD.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đọc tiếng có dấu thanh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRD_04_DATASET: SkillDataset = {
  skill_code: "C5.WRD.04",
  concept_label: "Đọc tiếng có dấu thanh",
  surface: "game",
  items: [
    {
      id: "wrd_ca_sac",
      label: "tiếng cá",
      glyph: "cá",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "tiếng thanh sắc",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_la_sac",
      label: "tiếng lá",
      glyph: "lá",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "tiếng thanh sắc",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_be_sac",
      label: "tiếng bé",
      glyph: "bé",
      value: 3,
      image: {
        kind: "emoji",
        ref: "👶",
      },
      category: {
        type: "tiếng thanh sắc",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_nho_sac",
      label: "tiếng chó",
      glyph: "chó",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "tiếng thanh sắc",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_ga_huyen",
      label: "tiếng gà",
      glyph: "gà",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "tiếng thanh huyền",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_bo_huyen",
      label: "tiếng bò",
      glyph: "bò",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🐮",
      },
      category: {
        type: "tiếng thanh huyền",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_meo_huyen",
      label: "tiếng mèo",
      glyph: "mèo",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "tiếng thanh huyền",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_co_huyen",
      label: "tiếng cò",
      glyph: "cò",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🦢",
      },
      category: {
        type: "tiếng thanh huyền",
      },
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["tiếng thanh sắc", "tiếng thanh huyền"],
      ordered: true,
    },
  },
  relations: [
    { type: "pair", source_id: "wrd_ca_sac", target_id: "wrd_la_sac" },
    { type: "pair", source_id: "wrd_be_sac", target_id: "wrd_nho_sac" },
    { type: "pair", source_id: "wrd_ga_huyen", target_id: "wrd_bo_huyen" },
    { type: "pair", source_id: "wrd_meo_huyen", target_id: "wrd_co_huyen" },
    { type: "contrast", source_id: "wrd_ca_sac", target_id: "wrd_ga_huyen" },
    { type: "contrast", source_id: "wrd_la_sac", target_id: "wrd_bo_huyen" },
    { type: "contrast", source_id: "wrd_be_sac", target_id: "wrd_meo_huyen" },
    { type: "contrast", source_id: "wrd_nho_sac", target_id: "wrd_co_huyen" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đọc tiếng có dấu thanh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc tiếng có dấu thanh",
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
      "Chúng mình cùng tìm hiểu về Đọc tiếng có dấu thanh nhé",
  },
  ordering: [
    "wrd_ca_sac",
    "wrd_la_sac",
    "wrd_be_sac",
    "wrd_nho_sac",
    "wrd_ga_huyen",
    "wrd_bo_huyen",
    "wrd_meo_huyen",
    "wrd_co_huyen",
  ],
};

export const C5_WRD_04_SEED: SkillSeed = {
  identity: C5_WRD_04_IDENTITY,
  dataset: C5_WRD_04_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-MEAS-0001",
      template: "GT-028",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-MEAS-0002",
      template: "GT-028",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-TIME-0001",
      template: "GT-029",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
  ],
};
