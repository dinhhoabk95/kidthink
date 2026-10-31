import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RIM_02_IDENTITY: SkillIdentity = {
  code: "C5.RIM.02",
  strand_code: "C5.RIM",
  competency_code: "C5",
  name: "Vần đóng bằng n: an ăn ân en ên in on ôn ơn un ưn",
  age_min: 5,
  age_max: 6,
  difficulty: 3,
  thinking_processes: ["observe", "compare"],
  tier: "advanced",
  prerequisites: ["C5.RIM.01"],
  learning_objectives: [
    {
      code: "LO-C5.RIM.02-01",
      behaviour:
        "Nhận biết và thực hành Vần đóng bằng n: an ăn ân en ên in on ôn ơn un ưn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RIM.02-02",
      behaviour:
        "Phân biệt và so sánh Vần đóng bằng n: an ăn ân en ên in on ôn ơn un ưn trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RIM.02-03",
      behaviour:
        "Vận dụng và ghi nhớ Vần đóng bằng n: an ăn ân en ên in on ôn ơn un ưn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RIM_02_DATASET: SkillDataset = {
  skill_code: "C5.RIM.02",
  concept_label: "Vần đóng bằng n: an ăn ân en ên in on ôn ơn un ưn",
  surface: "game",
  items: [
    {
      id: "rim_an",
      label: "vần an (cái bàn)",
      glyph: "an",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      value: 1,
      category: {
        type: "vần n một",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_ăn",
      label: "vần ăn (khăn quàng)",
      glyph: "ăn",
      image: {
        kind: "emoji",
        ref: "🧣",
      },
      value: 2,
      category: {
        type: "vần n một",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_ân",
      label: "vần ân (cái cân)",
      glyph: "ân",
      image: {
        kind: "emoji",
        ref: "⚖️",
      },
      value: 3,
      category: {
        type: "vần n một",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_en",
      label: "vần en (cái kèn)",
      glyph: "en",
      image: {
        kind: "emoji",
        ref: "🎺",
      },
      value: 4,
      category: {
        type: "vần n một",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_ên",
      label: "vần ên (ngọn nến)",
      glyph: "ên",
      image: {
        kind: "emoji",
        ref: "🕯️",
      },
      value: 5,
      category: {
        type: "vần n một",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_in",
      label: "vần in (cục pin)",
      glyph: "in",
      image: {
        kind: "emoji",
        ref: "🔋",
      },
      value: 6,
      category: {
        type: "vần n một",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_on",
      label: "vần on (cái nón)",
      glyph: "on",
      image: {
        kind: "emoji",
        ref: "👒",
      },
      value: 7,
      category: {
        type: "vần n hai",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ôn",
      label: "vần ôn (con chồn)",
      glyph: "ôn",
      image: {
        kind: "emoji",
        ref: "🦊",
      },
      value: 8,
      category: {
        type: "vần n hai",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ơn",
      label: "vần ơn (sơn màu)",
      glyph: "ơn",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      value: 9,
      category: {
        type: "vần n hai",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_un",
      label: "vần un (con giun)",
      glyph: "un",
      image: {
        kind: "emoji",
        ref: "🪱",
      },
      value: 10,
      category: {
        type: "vần n hai",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ưn",
      label: "vần ưn (khúc gỗ)",
      glyph: "ưn",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      value: 11,
      category: {
        type: "vần n hai",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description:
        "Làm quen cơ bản với Vần đóng bằng n: an ăn ân en ên in on ôn ơn un ưn",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Vần đóng bằng n: an ăn ân en ên in on ôn ơn un ưn",
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
      "Chúng mình cùng tìm hiểu về Vần đóng bằng n: an ăn ân en ên in on ôn ơn un ưn nhé",
  },
  ordering: [
    "rim_an",
    "rim_ăn",
    "rim_ân",
    "rim_en",
    "rim_ên",
    "rim_in",
    "rim_on",
    "rim_ôn",
    "rim_ơn",
    "rim_un",
    "rim_ưn",
  ],
  axes: {
    category: {
      values: ["vần n một", "vần n hai"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rim_an",
      target_id: "rim_ăn",
    },
    {
      type: "pair",
      source_id: "rim_on",
      target_id: "rim_ôn",
    },
    {
      type: "contrast",
      source_id: "rim_an",
      target_id: "rim_on",
    },
  ],
};

export const C5_RIM_02_SEED: SkillSeed = {
  identity: C5_RIM_02_IDENTITY,
  dataset: C5_RIM_02_DATASET,
  levels: [
    {
      code: "GL-C5-RIM-INTRO-0002",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "family",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.RIM.02"],
    },
    {
      code: "GL-C5-RIM-TAP-0006",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0006",
      template: "GT-002",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
