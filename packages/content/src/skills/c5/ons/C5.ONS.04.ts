import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ONS_04_IDENTITY: SkillIdentity = {
  code: "C5.ONS.04",
  strand_code: "C5.ONS",
  competency_code: "C5",
  name: "Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["listen", "compare"],
  tier: "advanced",
  prerequisites: ["C5.ONS.03"],
  learning_objectives: [
    {
      code: "LO-C5.ONS.04-01",
      behaviour:
        "Nhận biết và thực hành Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ONS.04-02",
      behaviour:
        "Phân biệt và so sánh Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ONS.04-03",
      behaviour:
        "Vận dụng và ghi nhớ Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ONS_04_DATASET: SkillDataset = {
  skill_code: "C5.ONS.04",
  concept_label: "Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh",
  surface: "game",
  items: [
    {
      id: "ons_r",
      label: "âm đầu r (con rùa)",
      glyph: "r",
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      category: {
        type: "âm một chữ",
        label: "Âm một chữ",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/ons/am_r.mp3",
    },
    {
      id: "ons_s",
      label: "âm đầu s (con sóc)",
      glyph: "s",
      image: {
        kind: "emoji",
        ref: "🐿️",
      },
      category: {
        type: "âm một chữ",
        label: "Âm một chữ",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/ons/am_s.mp3",
    },
    {
      id: "ons_t",
      label: "âm đầu t (quả táo)",
      glyph: "t",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "âm một chữ",
        label: "Âm một chữ",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/ons/am_t.mp3",
    },
    {
      id: "ons_v",
      label: "âm đầu v (con voi)",
      glyph: "v",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "âm một chữ",
        label: "Âm một chữ",
      },
      contrast_group: "primary",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/ons/am_v.mp3",
    },
    {
      id: "ons_x",
      label: "âm đầu x (xe đạp)",
      glyph: "x",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "âm một chữ",
        label: "Âm một chữ",
      },
      contrast_group: "primary",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/ons/am_x.mp3",
    },
    {
      id: "ons_ph",
      label: "âm đầu ph (tô phở)",
      glyph: "ph",
      image: {
        kind: "emoji",
        ref: "🍜",
      },
      category: {
        type: "âm chữ ghép",
        label: "Âm chữ ghép",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/ons/am_ph.mp3",
    },
    {
      id: "ons_th",
      label: "âm đầu th (con thỏ)",
      glyph: "th",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "âm chữ ghép",
        label: "Âm chữ ghép",
      },
      contrast_group: "contrast",
      value: 7,
      ordering: 7,
      audio_path: "/audio/vi/c5/ons/am_th.mp3",
    },
    {
      id: "ons_tr",
      label: "âm đầu tr (con trâu)",
      glyph: "tr",
      image: {
        kind: "emoji",
        ref: "🐃",
      },
      category: {
        type: "âm chữ ghép",
        label: "Âm chữ ghép",
      },
      contrast_group: "contrast",
      value: 8,
      ordering: 8,
      audio_path: "/audio/vi/c5/ons/am_tr.mp3",
    },
    {
      id: "ons_ch",
      label: "âm đầu ch (chim sẻ)",
      glyph: "ch",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "âm chữ ghép",
        label: "Âm chữ ghép",
      },
      contrast_group: "contrast",
      value: 9,
      ordering: 9,
      audio_path: "/audio/vi/c5/ons/am_ch.mp3",
    },
    {
      id: "ons_kh",
      label: "âm đầu kh (con khỉ)",
      glyph: "kh",
      image: {
        kind: "emoji",
        ref: "🐒",
      },
      category: {
        type: "âm chữ ghép",
        label: "Âm chữ ghép",
      },
      contrast_group: "contrast",
      value: 10,
      ordering: 10,
      audio_path: "/audio/vi/c5/ons/am_kh.mp3",
    },
  ],
  axes: {
    category: {
      values: ["âm một chữ", "âm chữ ghép"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "ons_r",
      target_id: "ons_tr",
      explanation: "Âm r là âm một chữ đối lập với âm tr là âm chữ ghép",
    },
    {
      type: "contrast",
      source_id: "ons_s",
      target_id: "ons_th",
      explanation: "Âm s là âm một chữ đối lập với âm th là âm chữ ghép",
    },
    {
      type: "contrast",
      source_id: "ons_t",
      target_id: "ons_ph",
      explanation: "Âm t là âm một chữ đối lập với âm ph là âm chữ ghép",
    },
    {
      type: "contrast",
      source_id: "ons_v",
      target_id: "ons_ch",
      explanation: "Âm v là âm một chữ đối lập với âm ch là âm chữ ghép",
    },
    {
      type: "contrast",
      source_id: "ons_x",
      target_id: "ons_kh",
      explanation: "Âm x là âm một chữ đối lập với âm kh là âm chữ ghép",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description:
        "Làm quen cơ bản với Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh",
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
      "Chúng mình cùng tìm hiểu về Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh nhé",
  },
  ordering: [
    "ons_r",
    "ons_s",
    "ons_t",
    "ons_v",
    "ons_x",
    "ons_ph",
    "ons_th",
    "ons_tr",
    "ons_ch",
    "ons_kh",
  ],
};

export const C5_ONS_04_SEED: SkillSeed = {
  identity: C5_ONS_04_IDENTITY,
  dataset: C5_ONS_04_DATASET,
  levels: [
    {
      code: "GL-C5-ONS-INTRO-0004",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "animal",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.ONS.04"],
    },
    {
      code: "GL-C5-ONS-TAP-0016",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-TAP-0018",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-ONS-MULTI-0016",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
