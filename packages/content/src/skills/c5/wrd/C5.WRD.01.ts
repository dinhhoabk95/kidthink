import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRD_01_IDENTITY: SkillIdentity = {
  code: "C5.WRD.01",
  strand_code: "C5.WRD",
  competency_code: "C5",
  name: "Nối từ với hình",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["match", "observe"],
  tier: "advanced",
  prerequisites: ["C5.PRN.01", "C5.ALP.04", "C5.LET.05"],
  learning_objectives: [
    {
      code: "LO-C5.WRD.01-01",
      behaviour: "Nhận biết và thực hành Nối từ với hình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRD.01-02",
      behaviour: "Vận dụng Nối từ với hình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRD.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nối từ với hình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRD_01_DATASET: SkillDataset = {
  skill_code: "C5.WRD.01",
  concept_label: "Nối từ với hình",
  surface: "game",
  items: [
    {
      id: "wrd_ba",
      label: "từ ba",
      glyph: "ba",
      value: 1,
      image: {
        kind: "emoji",
        ref: "👨",
      },
      category: {
        type: "người thân",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_me",
      label: "từ mẹ",
      glyph: "mẹ",
      value: 2,
      image: {
        kind: "emoji",
        ref: "👩",
      },
      category: {
        type: "người thân",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_be",
      label: "từ bé",
      glyph: "bé",
      value: 3,
      image: {
        kind: "emoji",
        ref: "👶",
      },
      category: {
        type: "người thân",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_ba_noi",
      label: "từ bà",
      glyph: "bà",
      value: 4,
      image: {
        kind: "emoji",
        ref: "👵",
      },
      category: {
        type: "người thân",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_ca",
      label: "từ cá",
      glyph: "cá",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "con vật",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_ga",
      label: "từ gà",
      glyph: "gà",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "con vật",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_meo",
      label: "từ mèo",
      glyph: "mèo",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "con vật",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_tho",
      label: "từ thỏ",
      glyph: "thỏ",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "con vật",
      },
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["người thân", "con vật"],
      ordered: true,
    },
  },
  relations: [
    { type: "pair", source_id: "wrd_ba", target_id: "wrd_me" },
    { type: "pair", source_id: "wrd_be", target_id: "wrd_ba_noi" },
    { type: "pair", source_id: "wrd_ca", target_id: "wrd_ga" },
    { type: "pair", source_id: "wrd_meo", target_id: "wrd_tho" },
    { type: "contrast", source_id: "wrd_ba", target_id: "wrd_ca" },
    { type: "contrast", source_id: "wrd_me", target_id: "wrd_ga" },
    { type: "contrast", source_id: "wrd_be", target_id: "wrd_meo" },
    { type: "contrast", source_id: "wrd_ba_noi", target_id: "wrd_tho" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nối từ với hình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nối từ với hình",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nối từ với hình nhé",
  },
  ordering: [
    "wrd_ba",
    "wrd_me",
    "wrd_be",
    "wrd_ba_noi",
    "wrd_ca",
    "wrd_ga",
    "wrd_meo",
    "wrd_tho",
  ],
};

export const C5_WRD_01_SEED: SkillSeed = {
  identity: C5_WRD_01_IDENTITY,
  dataset: C5_WRD_01_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-TAP-0001",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-TAP-0002",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-TCNT-0001",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
