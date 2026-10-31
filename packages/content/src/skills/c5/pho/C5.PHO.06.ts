import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_06_IDENTITY: SkillIdentity = {
  code: "C5.PHO.06",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Tách tiếng thành âm đầu và vần",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["listen", "deduce"],
  tier: "advanced",
  prerequisites: ["C5.PHO.04", "C5.RHY.02", "C5.ONS.03"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.06-01",
      behaviour:
        "Nhận biết và thực hành Tách tiếng thành âm đầu và vần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.06-02",
      behaviour:
        "Vận dụng Tách tiếng thành âm đầu và vần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tách tiếng thành âm đầu và vần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_06_DATASET: SkillDataset = {
  skill_code: "C5.PHO.06",
  concept_label: "Tách tiếng thành âm đầu và vần",
  surface: "game",
  items: [
    {
      id: "pho_ba",
      label: "tiếng ba (b + a)",
      glyph: "b+a",
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
      audio_path: "/audio/vi/c5/pho/ba.mp3",
    },
    {
      id: "pho_ca_nau",
      label: "tiếng cá (c + a)",
      glyph: "c+a",
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
      audio_path: "/audio/vi/c5/pho/ca.mp3",
    },
    {
      id: "pho_la_cay",
      label: "tiếng lá (l + a)",
      glyph: "l+a",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "tiếng vần a",
        label: "Tiếng vần a",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pho/la.mp3",
    },
    {
      id: "pho_bo_vang",
      label: "tiếng bò (b + o)",
      glyph: "b+o",
      image: {
        kind: "emoji",
        ref: "🐮",
      },
      category: {
        type: "tiếng vần o",
        label: "Tiếng vần o",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pho/bo.mp3",
    },
    {
      id: "pho_co_xanh",
      label: "tiếng cỏ (c + o)",
      glyph: "c+o",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "tiếng vần o",
        label: "Tiếng vần o",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pho/co.mp3",
    },
    {
      id: "pho_tho_trang",
      label: "tiếng thỏ (th + o)",
      glyph: "th+o",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "tiếng vần o",
        label: "Tiếng vần o",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pho/tho.mp3",
    },
  ],
  axes: {
    category: {
      values: ["tiếng vần a", "tiếng vần o"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pho_ba",
      target_id: "pho_bo_vang",
      explanation: "Tiếng vần a đối lập với tiếng vần o",
    },
    {
      type: "contrast",
      source_id: "pho_ca_nau",
      target_id: "pho_co_xanh",
      explanation: "Tiếng vần a đối lập với tiếng vần o",
    },
    {
      type: "contrast",
      source_id: "pho_la_cay",
      target_id: "pho_tho_trang",
      explanation: "Tiếng vần a đối lập với tiếng vần o",
    },
    {
      type: "pair",
      source_id: "pho_ba",
      target_id: "pho_bo_vang",
      explanation: "Cặp tiếng cùng âm đầu b khác phần vần",
    },
    {
      type: "pair",
      source_id: "pho_ca_nau",
      target_id: "pho_co_xanh",
      explanation: "Cặp tiếng cùng âm đầu c khác phần vần",
    },
    {
      type: "pair",
      source_id: "pho_la_cay",
      target_id: "pho_tho_trang",
      explanation: "Cặp so sánh tiếng vần a và tiếng vần o",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tách tiếng thành âm đầu và vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tách tiếng thành âm đầu và vần",
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
      "Chúng mình cùng tìm hiểu về Tách tiếng thành âm đầu và vần nhé",
  },
  ordering: [
    "pho_ba",
    "pho_ca_nau",
    "pho_la_cay",
    "pho_bo_vang",
    "pho_co_xanh",
    "pho_tho_trang",
  ],
};

export const C5_PHO_06_SEED: SkillSeed = {
  identity: C5_PHO_06_IDENTITY,
  dataset: C5_PHO_06_DATASET,
  levels: [
    {
      code: "GL-C5-PHO-FRAC-0001",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-FRAC-0002",
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
