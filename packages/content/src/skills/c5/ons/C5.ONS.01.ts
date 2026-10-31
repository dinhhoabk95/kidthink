import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ONS_01_IDENTITY: SkillIdentity = {
  code: "C5.ONS.01",
  strand_code: "C5.ONS",
  competency_code: "C5",
  name: "Tách tiếng ra âm đầu và vần",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["listen", "deduce"],
  tier: "core",
  prerequisites: ["C5.PHO.02"],
  learning_objectives: [
    {
      code: "LO-C5.ONS.01-01",
      behaviour:
        "Nhận biết và thực hành Tách tiếng ra âm đầu và vần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ONS.01-02",
      behaviour:
        "Phân biệt và so sánh Tách tiếng ra âm đầu và vần trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ONS.01-03",
      behaviour: "Vận dụng và ghi nhớ Tách tiếng ra âm đầu và vần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ONS_01_DATASET: SkillDataset = {
  skill_code: "C5.ONS.01",
  concept_label: "Tách tiếng ra âm đầu và vần",
  surface: "game",
  items: [
    {
      id: "ons_b",
      label: "âm đầu b (con bướm)",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "âm đầu tiếng",
        label: "Âm đầu",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/ons/am_b.mp3",
    },
    {
      id: "ons_c",
      label: "âm đầu c (con cá)",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "âm đầu tiếng",
        label: "Âm đầu",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/ons/am_c.mp3",
    },
    {
      id: "ons_m",
      label: "âm đầu m (con mèo)",
      glyph: "m",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "âm đầu tiếng",
        label: "Âm đầu",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/ons/am_m.mp3",
    },
    {
      id: "ons_van_uom",
      label: "vần ươm (bông hoa bướm đậu)",
      glyph: "ươm",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "vần của tiếng",
        label: "Phần vần",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/ons/van.mp3",
    },
    {
      id: "ons_van_a",
      label: "vần a (sóng nước cá bơi)",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "🌊",
      },
      category: {
        type: "vần của tiếng",
        label: "Phần vần",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/ons/van_a.mp3",
    },
    {
      id: "ons_van_eo",
      label: "vần eo (cuộn len mèo chơi)",
      glyph: "eo",
      image: {
        kind: "emoji",
        ref: "🧶",
      },
      category: {
        type: "vần của tiếng",
        label: "Phần vần",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/ons/van_eo.mp3",
    },
  ],
  axes: {
    category: {
      values: ["âm đầu tiếng", "vần của tiếng"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "ons_b",
      target_id: "ons_van_uom",
      explanation: "Âm đầu b đối lập với phần vần ươm",
    },
    {
      type: "contrast",
      source_id: "ons_c",
      target_id: "ons_van_a",
      explanation: "Âm đầu c đối lập với phần vần a",
    },
    {
      type: "contrast",
      source_id: "ons_m",
      target_id: "ons_van_eo",
      explanation: "Âm đầu m đối lập với phần vần eo",
    },
    {
      type: "pair",
      source_id: "ons_b",
      target_id: "ons_van_uom",
      explanation: "Ghép âm đầu b với vần ươm thành tiếng bướm",
    },
    {
      type: "pair",
      source_id: "ons_c",
      target_id: "ons_van_a",
      explanation: "Ghép âm đầu c với vần a thành tiếng cá",
    },
    {
      type: "pair",
      source_id: "ons_m",
      target_id: "ons_van_eo",
      explanation: "Ghép âm đầu m với vần eo thành tiếng mèo",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tách tiếng ra âm đầu và vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tách tiếng ra âm đầu và vần",
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
      "Chúng mình cùng tìm hiểu về Tách tiếng ra âm đầu và vần nhé",
  },
  ordering: [
    "ons_b",
    "ons_c",
    "ons_m",
    "ons_van_uom",
    "ons_van_a",
    "ons_van_eo",
  ],
};

export const C5_ONS_01_SEED: SkillSeed = {
  identity: C5_ONS_01_IDENTITY,
  dataset: C5_ONS_01_DATASET,
  levels: [
    {
      code: "GL-C5-ONS-INTRO-0001",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.ONS.01"],
    },
    {
      code: "GL-C5-ONS-TAP-0001",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-TAP-0002",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-TAP-0003",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-PAIR-0001",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-PAIR-0002",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-PAIR-0003",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
  ],
};
