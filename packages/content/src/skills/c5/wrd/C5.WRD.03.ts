import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRD_03_IDENTITY: SkillIdentity = {
  code: "C5.WRD.03",
  strand_code: "C5.WRD",
  competency_code: "C5",
  name: "Đánh vần tiếng đơn giản",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["solve", "sequence"],
  tier: "advanced",
  prerequisites: ["C5.WRD.02", "C5.PHO.07", "C5.RIM.01"],
  learning_objectives: [
    {
      code: "LO-C5.WRD.03-01",
      behaviour: "Nhận biết và thực hành Đánh vần tiếng đơn giản ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRD.03-02",
      behaviour: "Vận dụng Đánh vần tiếng đơn giản trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRD.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đánh vần tiếng đơn giản",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRD_03_DATASET: SkillDataset = {
  skill_code: "C5.WRD.03",
  concept_label: "Đánh vần tiếng đơn giản",
  surface: "game",
  items: [
    {
      id: "wrd_nha",
      label: "tiếng nhà",
      glyph: "nhà",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "đồ dùng quen",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_xe",
      label: "tiếng xe",
      glyph: "xe",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "đồ dùng quen",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_mu",
      label: "tiếng mũ",
      glyph: "mũ",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      category: {
        type: "đồ dùng quen",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_no",
      label: "tiếng nơ",
      glyph: "nơ",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🎀",
      },
      category: {
        type: "đồ dùng quen",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_bong",
      label: "tiếng bóng",
      glyph: "bóng",
      value: 5,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "đồ chơi vui",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_co",
      label: "tiếng cờ",
      glyph: "cờ",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🚩",
      },
      category: {
        type: "đồ chơi vui",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_ken",
      label: "tiếng kèn",
      glyph: "kèn",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🎺",
      },
      category: {
        type: "đồ chơi vui",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_trong",
      label: "tiếng trống",
      glyph: "trống",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "đồ chơi vui",
      },
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["đồ dùng quen", "đồ chơi vui"],
      ordered: true,
    },
  },
  relations: [
    { type: "sequence", source_id: "wrd_nha", target_id: "wrd_xe" },
    { type: "sequence", source_id: "wrd_xe", target_id: "wrd_mu" },
    { type: "sequence", source_id: "wrd_mu", target_id: "wrd_no" },
    { type: "sequence", source_id: "wrd_bong", target_id: "wrd_co" },
    { type: "sequence", source_id: "wrd_co", target_id: "wrd_ken" },
    { type: "sequence", source_id: "wrd_ken", target_id: "wrd_trong" },
    { type: "pair", source_id: "wrd_nha", target_id: "wrd_xe" },
    { type: "pair", source_id: "wrd_mu", target_id: "wrd_no" },
    { type: "pair", source_id: "wrd_bong", target_id: "wrd_co" },
    { type: "pair", source_id: "wrd_ken", target_id: "wrd_trong" },
    { type: "contrast", source_id: "wrd_nha", target_id: "wrd_bong" },
    { type: "contrast", source_id: "wrd_xe", target_id: "wrd_co" },
    { type: "contrast", source_id: "wrd_mu", target_id: "wrd_ken" },
    { type: "contrast", source_id: "wrd_no", target_id: "wrd_trong" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đánh vần tiếng đơn giản",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đánh vần tiếng đơn giản",
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
      "Chúng mình cùng tìm hiểu về Đánh vần tiếng đơn giản nhé",
  },
  ordering: [
    "wrd_nha",
    "wrd_xe",
    "wrd_mu",
    "wrd_no",
    "wrd_bong",
    "wrd_co",
    "wrd_ken",
    "wrd_trong",
  ],
};

export const C5_WRD_03_SEED: SkillSeed = {
  identity: C5_WRD_03_IDENTITY,
  dataset: C5_WRD_03_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SLOT-0003",
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
  ],
};
