import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ONS_02_IDENTITY: SkillIdentity = {
  code: "C5.ONS.02",
  strand_code: "C5.ONS",
  competency_code: "C5",
  name: "Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["listen", "match"],
  tier: "core",
  prerequisites: ["C5.ONS.01"],
  learning_objectives: [
    {
      code: "LO-C5.ONS.02-01",
      behaviour:
        "Nhận biết và thực hành Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ONS.02-02",
      behaviour:
        "Phân biệt và so sánh Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ONS.02-03",
      behaviour:
        "Vận dụng và ghi nhớ Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ONS_02_DATASET: SkillDataset = {
  skill_code: "C5.ONS.02",
  concept_label: "Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h",
  surface: "game",
  items: [
    {
      id: "ons_b",
      label: "âm b (bướm)",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "âm một chữ",
        label: "Âm một chữ",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/ons/am_b.mp3",
    },
    {
      id: "ons_đ",
      label: "âm đ (đào)",
      glyph: "đ",
      image: {
        kind: "emoji",
        ref: "🍑",
      },
      category: {
        type: "âm một chữ",
        label: "Âm một chữ",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/ons/am_d_ngang.mp3",
    },
    {
      id: "ons_h",
      label: "âm h (hoa)",
      glyph: "h",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "âm một chữ",
        label: "Âm một chữ",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/ons/am_h.mp3",
    },
    {
      id: "ons_c_k_q",
      label: "âm c/k/q (cá)",
      glyph: "c/k/q",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "âm nhiều chữ",
        label: "Âm nhiều chữ",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/ons/am_c.mp3",
    },
    {
      id: "ons_d_gi",
      label: "âm d/gi (dê)",
      glyph: "d/gi",
      image: {
        kind: "emoji",
        ref: "🐐",
      },
      category: {
        type: "âm nhiều chữ",
        label: "Âm nhiều chữ",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/ons/am_d.mp3",
    },
    {
      id: "ons_g_gh",
      label: "âm g/gh (gà)",
      glyph: "g/gh",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "âm nhiều chữ",
        label: "Âm nhiều chữ",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/ons/am_g.mp3",
    },
  ],
  axes: {
    category: {
      values: ["âm một chữ", "âm nhiều chữ"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "ons_b",
      target_id: "ons_c_k_q",
      explanation: "Cặp âm đầu cơ bản trong nhóm một",
    },
    {
      type: "pair",
      source_id: "ons_đ",
      target_id: "ons_d_gi",
      explanation: "Cặp âm đầu d và đ tương ứng",
    },
    {
      type: "pair",
      source_id: "ons_h",
      target_id: "ons_g_gh",
      explanation: "Cặp âm đầu h và g gh tương ứng",
    },
    {
      type: "contrast",
      source_id: "ons_b",
      target_id: "ons_c_k_q",
      explanation: "Âm một chữ đối lập với âm nhiều cách viết",
    },
    {
      type: "contrast",
      source_id: "ons_đ",
      target_id: "ons_d_gi",
      explanation: "Âm một chữ đối lập với âm nhiều cách viết",
    },
    {
      type: "contrast",
      source_id: "ons_h",
      target_id: "ons_g_gh",
      explanation: "Âm một chữ đối lập với âm nhiều cách viết",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description:
        "Làm quen cơ bản với Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h",
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
      "Chúng mình cùng tìm hiểu về Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h nhé",
  },
  ordering: ["ons_b", "ons_đ", "ons_h", "ons_c_k_q", "ons_d_gi", "ons_g_gh"],
};

export const C5_ONS_02_SEED: SkillSeed = {
  identity: C5_ONS_02_IDENTITY,
  dataset: C5_ONS_02_DATASET,
  levels: [
    {
      code: "GL-C5-ONS-INTRO-0002",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "family",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.ONS.02"],
    },
    {
      code: "GL-C5-ONS-TAP-0006",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-MULTI-0006",
      template: "GT-002",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
