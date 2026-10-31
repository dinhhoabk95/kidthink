import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_07_IDENTITY: SkillIdentity = {
  code: "C5.PHO.07",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Ghép âm đầu với vần thành tiếng",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["listen", "solve"],
  tier: "advanced",
  prerequisites: ["C5.PHO.06", "C5.ONS.04"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.07-01",
      behaviour:
        "Nhận biết và thực hành Ghép âm đầu với vần thành tiếng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.07-02",
      behaviour:
        "Vận dụng Ghép âm đầu với vần thành tiếng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Ghép âm đầu với vần thành tiếng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_07_DATASET: SkillDataset = {
  skill_code: "C5.PHO.07",
  concept_label: "Ghép âm đầu với vần thành tiếng",
  surface: "game",
  items: [
    {
      id: "pho_tieng_ba",
      label: "tiếng ba (b + a)",
      glyph: "ba",
      image: {
        kind: "emoji",
        ref: "👨",
      },
      category: {
        type: "tiếng vần a",
        label: "Tiếng vần a",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/pho/tieng_ba.mp3",
    },
    {
      id: "pho_tieng_ca",
      label: "tiếng cá (c + a)",
      glyph: "cá",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "tiếng vần a",
        label: "Tiếng vần a",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/pho/tieng_ca.mp3",
    },
    {
      id: "pho_tieng_ga",
      label: "tiếng gà (g + a)",
      glyph: "gà",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "tiếng vần a",
        label: "Tiếng vần a",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pho/tieng_ga.mp3",
    },
    {
      id: "pho_tieng_be",
      label: "tiếng bé (b + e)",
      glyph: "bé",
      image: {
        kind: "emoji",
        ref: "👶",
      },
      category: {
        type: "tiếng vần e",
        label: "Tiếng vần e",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pho/tieng_be.mp3",
    },
    {
      id: "pho_tieng_me",
      label: "tiếng mẹ (m + e)",
      glyph: "mẹ",
      image: {
        kind: "emoji",
        ref: "👩",
      },
      category: {
        type: "tiếng vần e",
        label: "Tiếng vần e",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pho/tieng_me.mp3",
    },
    {
      id: "pho_tieng_xe",
      label: "tiếng xe (x + e)",
      glyph: "xe",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "tiếng vần e",
        label: "Tiếng vần e",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pho/tieng_xe.mp3",
    },
  ],
  axes: {
    category: {
      values: ["tiếng vần a", "tiếng vần e"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pho_tieng_ba",
      target_id: "pho_tieng_be",
      explanation: "Tiếng ghép vần a đối lập với tiếng ghép vần e",
    },
    {
      type: "contrast",
      source_id: "pho_tieng_ca",
      target_id: "pho_tieng_me",
      explanation: "Tiếng ghép vần a đối lập với tiếng ghép vần e",
    },
    {
      type: "contrast",
      source_id: "pho_tieng_ga",
      target_id: "pho_tieng_xe",
      explanation: "Tiếng ghép vần a đối lập với tiếng ghép vần e",
    },
    {
      type: "pair",
      source_id: "pho_tieng_ba",
      target_id: "pho_tieng_be",
      explanation: "Cặp tiếng cùng âm đầu b ghép với vần a và vần e",
    },
    {
      type: "pair",
      source_id: "pho_tieng_ca",
      target_id: "pho_tieng_me",
      explanation: "Cặp tiếng ghép vần tương ứng",
    },
    {
      type: "pair",
      source_id: "pho_tieng_ga",
      target_id: "pho_tieng_xe",
      explanation: "Cặp tiếng ghép vần tương ứng",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ghép âm đầu với vần thành tiếng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghép âm đầu với vần thành tiếng",
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
      "Chúng mình cùng tìm hiểu về Ghép âm đầu với vần thành tiếng nhé",
  },
  ordering: [
    "pho_tieng_ba",
    "pho_tieng_ca",
    "pho_tieng_ga",
    "pho_tieng_be",
    "pho_tieng_me",
    "pho_tieng_xe",
  ],
};

export const C5_PHO_07_SEED: SkillSeed = {
  identity: C5_PHO_07_IDENTITY,
  dataset: C5_PHO_07_DATASET,
  levels: [
    {
      code: "GL-C5-PHO-FRAC-0006",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-FRAC-0007",
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
  ],
};
