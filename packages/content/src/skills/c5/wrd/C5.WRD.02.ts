import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRD_02_IDENTITY: SkillIdentity = {
  code: "C5.WRD.02",
  strand_code: "C5.WRD",
  competency_code: "C5",
  name: "Đọc tiếng quen thuộc",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["recall", "match"],
  tier: "advanced",
  prerequisites: ["C5.ALP.06", "C5.LET.05"],
  learning_objectives: [
    {
      code: "LO-C5.WRD.02-01",
      behaviour: "Nhận biết và thực hành Đọc tiếng quen thuộc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRD.02-02",
      behaviour: "Vận dụng Đọc tiếng quen thuộc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRD.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đọc tiếng quen thuộc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRD_02_DATASET: SkillDataset = {
  skill_code: "C5.WRD.02",
  concept_label: "Đọc tiếng quen thuộc",
  surface: "game",
  items: [
    {
      id: "wrd_hoa",
      label: "tiếng hoa",
      glyph: "hoa",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "cây hoa lá",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_la",
      label: "tiếng lá",
      glyph: "lá",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "cây hoa lá",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_qua",
      label: "tiếng quả",
      glyph: "quả",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "cây hoa lá",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_cay",
      label: "tiếng cây",
      glyph: "cây",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "cây hoa lá",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_chim",
      label: "tiếng chim",
      glyph: "chim",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "loài vật quen",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_ca",
      label: "tiếng cá",
      glyph: "cá",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "loài vật quen",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_cho",
      label: "tiếng chó",
      glyph: "chó",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "loài vật quen",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_meo",
      label: "tiếng mèo",
      glyph: "mèo",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "loài vật quen",
      },
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["cây hoa lá", "loài vật quen"],
      ordered: true,
    },
  },
  relations: [
    { type: "pair", source_id: "wrd_hoa", target_id: "wrd_la" },
    { type: "pair", source_id: "wrd_qua", target_id: "wrd_cay" },
    { type: "pair", source_id: "wrd_chim", target_id: "wrd_ca" },
    { type: "pair", source_id: "wrd_cho", target_id: "wrd_meo" },
    { type: "contrast", source_id: "wrd_hoa", target_id: "wrd_chim" },
    { type: "contrast", source_id: "wrd_la", target_id: "wrd_ca" },
    { type: "contrast", source_id: "wrd_qua", target_id: "wrd_cho" },
    { type: "contrast", source_id: "wrd_cay", target_id: "wrd_meo" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đọc tiếng quen thuộc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc tiếng quen thuộc",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đọc tiếng quen thuộc nhé",
  },
  ordering: [
    "wrd_hoa",
    "wrd_la",
    "wrd_qua",
    "wrd_cay",
    "wrd_chim",
    "wrd_ca",
    "wrd_cho",
    "wrd_meo",
  ],
};

export const C5_WRD_02_SEED: SkillSeed = {
  identity: C5_WRD_02_IDENTITY,
  dataset: C5_WRD_02_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-TAP-0004",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SLOT-0001",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SIZE-0001",
      template: "GT-009",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
