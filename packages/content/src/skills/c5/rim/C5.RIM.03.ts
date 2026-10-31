import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RIM_03_IDENTITY: SkillIdentity = {
  code: "C5.RIM.03",
  strand_code: "C5.RIM",
  competency_code: "C5",
  name: "Vần đóng bằng m · ng: am ăm âm ang ăng âng ong ông ung ưng",
  age_min: 5,
  age_max: 6,
  difficulty: 3,
  thinking_processes: ["observe", "compare"],
  tier: "advanced",
  prerequisites: ["C5.RIM.02"],
  learning_objectives: [
    {
      code: "LO-C5.RIM.03-01",
      behaviour:
        "Nhận biết và thực hành Vần đóng bằng m · ng: am ăm âm ang ăng âng ong ông ung ưng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RIM.03-02",
      behaviour:
        "Phân biệt và so sánh Vần đóng bằng m · ng: am ăm âm ang ăng âng ong ông ung ưng trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RIM.03-03",
      behaviour:
        "Vận dụng và ghi nhớ Vần đóng bằng m · ng: am ăm âm ang ăng âng ong ông ung ưng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RIM_03_DATASET: SkillDataset = {
  skill_code: "C5.RIM.03",
  concept_label: "Vần đóng bằng m · ng: am ăm âm ang ăng âng ong ông ung ưng",
  surface: "game",
  items: [
    {
      id: "rim_am",
      label: "vần am (quả cam)",
      glyph: "am",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      value: 1,
      category: {
        type: "vần có m",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_ăm",
      label: "vần ăm (tăm tre)",
      glyph: "ăm",
      image: {
        kind: "emoji",
        ref: "🎋",
      },
      value: 2,
      category: {
        type: "vần có m",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_âm",
      label: "vần âm (cây nấm)",
      glyph: "âm",
      image: {
        kind: "emoji",
        ref: "🍄",
      },
      value: 3,
      category: {
        type: "vần có m",
      },
      contrast_group: "primary",
    },
    {
      id: "rim_ang",
      label: "vần ang (cái bảng)",
      glyph: "ang",
      image: {
        kind: "emoji",
        ref: "📋",
      },
      value: 4,
      category: {
        type: "vần có ng",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ăng",
      label: "vần ăng (cái răng)",
      glyph: "ăng",
      image: {
        kind: "emoji",
        ref: "🦷",
      },
      value: 5,
      category: {
        type: "vần có ng",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_âng",
      label: "vần âng (bậc thang)",
      glyph: "âng",
      image: {
        kind: "emoji",
        ref: "🪜",
      },
      value: 6,
      category: {
        type: "vần có ng",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ong",
      label: "vần ong (con ong)",
      glyph: "ong",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      value: 7,
      category: {
        type: "vần có ng",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ông",
      label: "vần ông (cái trống)",
      glyph: "ông",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      value: 8,
      category: {
        type: "vần có ng",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ung",
      label: "vần ung (cái cung)",
      glyph: "ung",
      image: {
        kind: "emoji",
        ref: "🏹",
      },
      value: 9,
      category: {
        type: "vần có ng",
      },
      contrast_group: "contrast",
    },
    {
      id: "rim_ưng",
      label: "vần ưng (củ gừng)",
      glyph: "ưng",
      image: {
        kind: "emoji",
        ref: "🫚",
      },
      value: 10,
      category: {
        type: "vần có ng",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description:
        "Làm quen cơ bản với Vần đóng bằng m · ng: am ăm âm ang ăng âng ong ông ung ưng",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Vần đóng bằng m · ng: am ăm âm ang ăng âng ong ông ung ưng",
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
      "Chúng mình cùng tìm hiểu về Vần đóng bằng m · ng: am ăm âm ang ăng âng ong ông ung ưng nhé",
  },
  ordering: [
    "rim_am",
    "rim_ăm",
    "rim_âm",
    "rim_ang",
    "rim_ăng",
    "rim_âng",
    "rim_ong",
    "rim_ông",
    "rim_ung",
    "rim_ưng",
  ],
  axes: {
    category: {
      values: ["vần có m", "vần có ng"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rim_am",
      target_id: "rim_ăm",
    },
    {
      type: "pair",
      source_id: "rim_ang",
      target_id: "rim_ăng",
    },
    {
      type: "contrast",
      source_id: "rim_am",
      target_id: "rim_ang",
    },
  ],
};

export const C5_RIM_03_SEED: SkillSeed = {
  identity: C5_RIM_03_IDENTITY,
  dataset: C5_RIM_03_DATASET,
  levels: [
    {
      code: "GL-C5-RIM-INTRO-0003",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "home",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.RIM.03"],
    },
    {
      code: "GL-C5-RIM-TAP-0011",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0013",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0011",
      template: "GT-002",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
