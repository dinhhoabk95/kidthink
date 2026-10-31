import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RIM_04_IDENTITY: SkillIdentity = {
  code: "C5.RIM.04",
  strand_code: "C5.RIM",
  competency_code: "C5",
  name: "Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["observe", "sort"],
  tier: "advanced",
  prerequisites: ["C5.RIM.03"],
  learning_objectives: [
    {
      code: "LO-C5.RIM.04-01",
      behaviour:
        "Nhận biết và thực hành Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RIM.04-02",
      behaviour:
        "Phân biệt và so sánh Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RIM.04-03",
      behaviour:
        "Vận dụng và ghi nhớ Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RIM_04_DATASET: SkillDataset = {
  skill_code: "C5.RIM.04",
  concept_label: "Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp",
  surface: "game",
  items: [
    {
      id: "rim_ac",
      label: "vần ac (chim hạc)",
      glyph: "ac",
      image: {
        kind: "emoji",
        ref: "🦩",
      },
      value: 1,
      category: {
        type: "vần có c",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_ăc",
      label: "vần ăc (mặc áo)",
      glyph: "ăc",
      image: {
        kind: "emoji",
        ref: "🧥",
      },
      value: 2,
      category: {
        type: "vần có c",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_âc",
      label: "vần âc (bậc thang)",
      glyph: "âc",
      image: {
        kind: "emoji",
        ref: "🪜",
      },
      value: 3,
      category: {
        type: "vần có c",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_at",
      label: "vần at (cái bát)",
      glyph: "at",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      value: 4,
      category: {
        type: "vần t p",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ăt",
      label: "vần ăt (đôi mắt)",
      glyph: "ăt",
      image: {
        kind: "emoji",
        ref: "👀",
      },
      value: 5,
      category: {
        type: "vần t p",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ât",
      label: "vần ât (đôi tất)",
      glyph: "ât",
      image: {
        kind: "emoji",
        ref: "🧦",
      },
      value: 6,
      category: {
        type: "vần t p",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ap",
      label: "vần ap (ngọn tháp)",
      glyph: "ap",
      image: {
        kind: "emoji",
        ref: "🗼",
      },
      value: 7,
      category: {
        type: "vần t p",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ăp",
      label: "vần ăp (bắp ngô)",
      glyph: "ăp",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      value: 8,
      category: {
        type: "vần t p",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_âp",
      label: "vần âp (tàu tập)",
      glyph: "âp",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      value: 9,
      category: {
        type: "vần t p",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description:
        "Làm quen cơ bản với Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp",
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
      "Chúng mình cùng tìm hiểu về Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp nhé",
  },
  ordering: [
    "rim_ac",
    "rim_ăc",
    "rim_âc",
    "rim_at",
    "rim_ăt",
    "rim_ât",
    "rim_ap",
    "rim_ăp",
    "rim_âp",
  ],
  axes: {
    category: {
      values: ["vần có c", "vần t p"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rim_ac",
      target_id: "rim_ăc",
    },
    {
      type: "pair",
      source_id: "rim_at",
      target_id: "rim_ăt",
    },
    {
      type: "contrast",
      source_id: "rim_ac",
      target_id: "rim_at",
    },
  ],
};

export const C5_RIM_04_SEED: SkillSeed = {
  identity: C5_RIM_04_IDENTITY,
  dataset: C5_RIM_04_DATASET,
  levels: [
    {
      code: "GL-C5-RIM-INTRO-0004",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "animal",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.RIM.04"],
    },
    {
      code: "GL-C5-RIM-TAP-0016",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0018",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0016",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
