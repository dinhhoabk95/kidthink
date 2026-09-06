import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_07_IDENTITY: SkillIdentity = {
  code: "C5.ALP.07",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Chữ ghép: ch · kh · nh · th · tr · ph",
  age_min: 6,
  age_max: 7,
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
      id: "let_ê",
      label: "chữ ê",
      glyph: "ê",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "primary",
    },
    {
      id: "let_g",
      label: "chữ g",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "🅶",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_h",
      label: "chữ h",
      glyph: "h",
      image: {
        kind: "emoji",
        ref: "🅷",
      },
      contrast_group: "primary",
    },
    {
      id: "let_i",
      label: "chữ i",
      glyph: "i",
      image: {
        kind: "emoji",
        ref: "🅸",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_k",
      label: "chữ k",
      glyph: "k",
      image: {
        kind: "emoji",
        ref: "🅺",
      },
      contrast_group: "primary",
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
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_ê", "let_g", "let_h", "let_i", "let_k"],
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
    {
      code: "GL-C5-ALP-TCNT-0012",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCMP-0013",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCMP-0014",
      template: "GT-003",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PAIR-0011",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PAIR-0012",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PATT-0013",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PATT-0014",
      template: "GT-005",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
