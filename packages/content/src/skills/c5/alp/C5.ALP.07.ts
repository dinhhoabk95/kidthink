import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_07_IDENTITY: SkillIdentity = {
  code: "C5.ALP.07",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Chữ ghép: ch · kh · nh · th · tr · ph",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["observe", "solve"],
  tier: "advanced",
  prerequisites: ["C5.ALP.06", "C5.DGR.01"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.07-01",
      behaviour:
        "Nhận biết và thực hành Chữ ghép: ch · kh · nh · th · tr · ph ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.07-02",
      behaviour:
        "Vận dụng Chữ ghép: ch · kh · nh · th · tr · ph trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chữ ghép: ch · kh · nh · th · tr · ph",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_07_DATASET: SkillDataset = {
  skill_code: "C5.ALP.07",
  concept_label: "Chữ ghép: ch · kh · nh · th · tr · ph",
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
        type: "chữ ghép nhóm một",
        label: "Chữ ghép nhóm một",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
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
        type: "chữ ghép nhóm một",
        label: "Chữ ghép nhóm một",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
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
        type: "chữ ghép nhóm một",
        label: "Chữ ghép nhóm một",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
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
        type: "chữ ghép nhóm hai",
        label: "Chữ ghép nhóm hai",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
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
        type: "chữ ghép nhóm hai",
        label: "Chữ ghép nhóm hai",
      },
      contrast_group: "contrast",
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
        type: "chữ ghép nhóm hai",
        label: "Chữ ghép nhóm hai",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "dgr_ch",
      target_id: "dgr_kh",
      explanation:
        "chữ ch và chữ kh đều là chữ ghép bắt đầu bằng phụ âm đơn kết hợp h",
    },
    {
      type: "pair",
      source_id: "dgr_th",
      target_id: "dgr_tr",
      explanation: "chữ th và chữ tr đều bắt đầu bằng chữ cái t",
    },
    {
      type: "contrast",
      source_id: "dgr_ch",
      target_id: "dgr_th",
      explanation: "chữ ghép ch đối lập với chữ ghép th",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ ghép: ch · kh · nh · th · tr · ph",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Chữ ghép: ch · kh · nh · th · tr · ph",
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
      "Chúng mình cùng tìm hiểu về Chữ ghép: ch · kh · nh · th · tr · ph nhé",
  },
  ordering: ["dgr_ch", "dgr_kh", "dgr_nh", "dgr_th", "dgr_tr", "dgr_ph"],
};

export const C5_ALP_07_SEED: SkillSeed = {
  identity: C5_ALP_07_IDENTITY,
  dataset: C5_ALP_07_DATASET,
  levels: [
    {
      code: "GL-C5-ALP-TAP-0013",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TAP-0014",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCNT-0011",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
  ],
};
