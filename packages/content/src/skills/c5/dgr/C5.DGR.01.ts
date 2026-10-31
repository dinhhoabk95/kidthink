import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DGR_01_IDENTITY: SkillIdentity = {
  code: "C5.DGR.01",
  strand_code: "C5.DGR",
  competency_code: "C5",
  name: "Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu",
  age_min: 5,
  age_max: 6,
  difficulty: 3,
  thinking_processes: ["observe", "match"],
  tier: "advanced",
  prerequisites: ["C5.LET.05"],
  learning_objectives: [
    {
      code: "LO-C5.DGR.01-01",
      behaviour:
        "Nhận biết và thực hành Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DGR.01-02",
      behaviour:
        "Phân biệt và so sánh Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DGR.01-03",
      behaviour:
        "Vận dụng và ghi nhớ Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DGR_01_DATASET: SkillDataset = {
  skill_code: "C5.DGR.01",
  concept_label: "Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu",
  surface: "game",
  items: [
    {
      id: "dgr_ch",
      label: "chữ ch (chú chó)",
      glyph: "ch",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "chữ ghép nhóm 1",
        label: "Chữ ghép nhóm 1",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "dgr_gh",
      label: "chữ gh (cái ghế)",
      glyph: "gh",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "chữ ghép nhóm 1",
        label: "Chữ ghép nhóm 1",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "dgr_gi",
      label: "chữ gi (đôi giày)",
      glyph: "gi",
      image: {
        kind: "emoji",
        ref: "👟",
      },
      category: {
        type: "chữ ghép nhóm 1",
        label: "Chữ ghép nhóm 1",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "dgr_kh",
      label: "chữ kh (chú khỉ)",
      glyph: "kh",
      image: {
        kind: "emoji",
        ref: "🐒",
      },
      category: {
        type: "chữ ghép nhóm 1",
        label: "Chữ ghép nhóm 1",
      },
      contrast_group: "primary",
      value: 4,
      ordering: 4,
    },
    {
      id: "dgr_nh",
      label: "chữ nh (ngôi nhà)",
      glyph: "nh",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "chữ ghép nhóm 1",
        label: "Chữ ghép nhóm 1",
      },
      contrast_group: "primary",
      value: 5,
      ordering: 5,
    },
    {
      id: "dgr_ph",
      label: "chữ ph (tô phở)",
      glyph: "ph",
      image: {
        kind: "emoji",
        ref: "🍜",
      },
      category: {
        type: "chữ ghép nhóm 2",
        label: "Chữ ghép nhóm 2",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
    {
      id: "dgr_th",
      label: "chữ th (chú thỏ)",
      glyph: "th",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "chữ ghép nhóm 2",
        label: "Chữ ghép nhóm 2",
      },
      contrast_group: "contrast",
      value: 7,
      ordering: 7,
    },
    {
      id: "dgr_tr",
      label: "chữ tr (cây tre)",
      glyph: "tr",
      image: {
        kind: "emoji",
        ref: "🎋",
      },
      category: {
        type: "chữ ghép nhóm 2",
        label: "Chữ ghép nhóm 2",
      },
      contrast_group: "contrast",
      value: 8,
      ordering: 8,
    },
    {
      id: "dgr_qu",
      label: "chữ qu (hộp quà)",
      glyph: "qu",
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "chữ ghép nhóm 2",
        label: "Chữ ghép nhóm 2",
      },
      contrast_group: "contrast",
      value: 9,
      ordering: 9,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "dgr_ch",
      target_id: "dgr_gh",
      explanation: "cùng là chữ ghép nhóm một",
    },
    {
      type: "pair",
      source_id: "dgr_ph",
      target_id: "dgr_th",
      explanation: "cùng là chữ ghép nhóm hai",
    },
    {
      type: "contrast",
      source_id: "dgr_ch",
      target_id: "dgr_ph",
      explanation: "khác nhóm chữ ghép",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description:
        "Làm quen cơ bản với Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu",
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
      "Chúng mình cùng tìm hiểu về Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu nhé",
  },
  ordering: [
    "dgr_ch",
    "dgr_gh",
    "dgr_gi",
    "dgr_kh",
    "dgr_nh",
    "dgr_ph",
    "dgr_th",
    "dgr_tr",
    "dgr_qu",
  ],
};

export const C5_DGR_01_SEED: SkillSeed = {
  identity: C5_DGR_01_IDENTITY,
  dataset: C5_DGR_01_DATASET,
  levels: [
    {
      code: "GL-C5-DGR-INTRO-0001",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.DGR.01"],
    },
    {
      code: "GL-C5-DGR-TAP-0001",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-TAP-0003",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-MULTI-0001",
      template: "GT-002",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
