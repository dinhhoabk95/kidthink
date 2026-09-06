import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RIM_02_IDENTITY: SkillIdentity = {
  code: "C5.RIM.02",
  strand_code: "C5.RIM",
  competency_code: "C5",
  name: "Vần đóng bằng n: an ăn ân en ên in on ôn ơn un ưn",
  age_min: 6,
  age_max: 7,
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
      label: "vần an",
      glyph: "an",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ăn",
      label: "vần ăn",
      glyph: "ăn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ân",
      label: "vần ân",
      glyph: "ân",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_en",
      label: "vần en",
      glyph: "en",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ên",
      label: "vần ên",
      glyph: "ên",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_in",
      label: "vần in",
      glyph: "in",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_on",
      label: "vần on",
      glyph: "on",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ôn",
      label: "vần ôn",
      glyph: "ôn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ơn",
      label: "vần ơn",
      glyph: "ơn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_un",
      label: "vần un",
      glyph: "un",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ưn",
      label: "vần ưn",
      glyph: "ưn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
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
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
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
      code: "GL-C5-RIM-TAP-0007",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "family",
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
      code: "GL-C5-RIM-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
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
    {
      code: "GL-C5-RIM-MULTI-0007",
      template: "GT-002",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0008",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0009",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-RIM-MULTI-0010",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
