import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRD_05_IDENTITY: SkillIdentity = {
  code: "C5.WRD.05",
  strand_code: "C5.WRD",
  competency_code: "C5",
  name: "Đọc từ hai tiếng",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["solve", "sequence"],
  tier: "advanced",
  prerequisites: ["C5.WRD.04"],
  learning_objectives: [
    {
      code: "LO-C5.WRD.05-01",
      behaviour: "Nhận biết và thực hành Đọc từ hai tiếng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRD.05-02",
      behaviour: "Vận dụng Đọc từ hai tiếng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRD.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đọc từ hai tiếng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRD_05_DATASET: SkillDataset = {
  skill_code: "C5.WRD.05",
  concept_label: "Đọc từ hai tiếng",
  surface: "game",
  items: [
    {
      id: "wrd_hoa_hong",
      label: "hoa hồng",
      glyph: "hoa hồng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌹",
      },
      category: {
        type: "hoa và quả",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_hoa_sen",
      label: "hoa sen",
      glyph: "hoa sen",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🪷",
      },
      category: {
        type: "hoa và quả",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_qua_tao",
      label: "quả táo",
      glyph: "quả táo",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa và quả",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_qua_cam",
      label: "quả cam",
      glyph: "quả cam",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "hoa và quả",
      },
      contrast_group: "primary",
    },
    {
      id: "wrd_con_chim",
      label: "con chim",
      glyph: "con chim",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "các con vật",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_con_tho",
      label: "con thỏ",
      glyph: "con thỏ",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "các con vật",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_con_ca",
      label: "con cá",
      glyph: "con cá",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "các con vật",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrd_con_ong",
      label: "con ong",
      glyph: "con ong",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "các con vật",
      },
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["hoa và quả", "các con vật"],
      ordered: true,
    },
  },
  relations: [
    { type: "sequence", source_id: "wrd_hoa_hong", target_id: "wrd_hoa_sen" },
    { type: "sequence", source_id: "wrd_hoa_sen", target_id: "wrd_qua_tao" },
    { type: "sequence", source_id: "wrd_qua_tao", target_id: "wrd_qua_cam" },
    { type: "sequence", source_id: "wrd_con_chim", target_id: "wrd_con_tho" },
    { type: "sequence", source_id: "wrd_con_tho", target_id: "wrd_con_ca" },
    { type: "sequence", source_id: "wrd_con_ca", target_id: "wrd_con_ong" },
    { type: "pair", source_id: "wrd_hoa_hong", target_id: "wrd_hoa_sen" },
    { type: "pair", source_id: "wrd_qua_tao", target_id: "wrd_qua_cam" },
    { type: "pair", source_id: "wrd_con_chim", target_id: "wrd_con_tho" },
    { type: "pair", source_id: "wrd_con_ca", target_id: "wrd_con_ong" },
    { type: "contrast", source_id: "wrd_hoa_hong", target_id: "wrd_con_chim" },
    { type: "contrast", source_id: "wrd_hoa_sen", target_id: "wrd_con_tho" },
    { type: "contrast", source_id: "wrd_qua_tao", target_id: "wrd_con_ca" },
    { type: "contrast", source_id: "wrd_qua_cam", target_id: "wrd_con_ong" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đọc từ hai tiếng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc từ hai tiếng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đọc từ hai tiếng nhé",
  },
  ordering: [
    "wrd_hoa_hong",
    "wrd_hoa_sen",
    "wrd_qua_tao",
    "wrd_qua_cam",
    "wrd_con_chim",
    "wrd_con_tho",
    "wrd_con_ca",
    "wrd_con_ong",
  ],
};

export const C5_WRD_05_SEED: SkillSeed = {
  identity: C5_WRD_05_IDENTITY,
  dataset: C5_WRD_05_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SLOT-0005",
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
  ],
};
