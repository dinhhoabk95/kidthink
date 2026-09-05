import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_08_IDENTITY: SkillIdentity = {
  code: "C5.ALP.08",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Chữ ghép ba: ngh · gh · gi · qu",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["observe", "solve"],
  tier: "advanced",
  prerequisites: ["C5.ALP.07"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.08-01",
      behaviour:
        "Nhận biết và thực hành Chữ ghép ba: ngh · gh · gi · qu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.08-02",
      behaviour:
        "Vận dụng Chữ ghép ba: ngh · gh · gi · qu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.08-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chữ ghép ba: ngh · gh · gi · qu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_08_DATASET: SkillDataset = {
  skill_code: "C5.ALP.08",
  concept_label: "Chữ ghép ba: ngh · gh · gi · qu",
  surface: "game",
  items: [
    {
      id: "let_g",
      label: "chữ g",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "🅶",
      },
      contrast_group: "primary",
    },
    {
      id: "let_h",
      label: "chữ h",
      glyph: "h",
      image: {
        kind: "emoji",
        ref: "🅷",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_i",
      label: "chữ i",
      glyph: "i",
      image: {
        kind: "emoji",
        ref: "🅸",
      },
      contrast_group: "primary",
    },
    {
      id: "let_k",
      label: "chữ k",
      glyph: "k",
      image: {
        kind: "emoji",
        ref: "🅺",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_l",
      label: "chữ l",
      glyph: "l",
      image: {
        kind: "emoji",
        ref: "🅻",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ ghép ba: ngh · gh · gi · qu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ ghép ba: ngh · gh · gi · qu",
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
      "Chúng mình cùng tìm hiểu về Chữ ghép ba: ngh · gh · gi · qu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_g", "let_h", "let_i", "let_k", "let_l"],
};

export const C5_ALP_08_SEED: SkillSeed = {
  identity: C5_ALP_08_IDENTITY,
  dataset: C5_ALP_08_DATASET,
  levels: [
    {
      code: "GL-C5-ALP-TAP-0015",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TAP-0016",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCNT-0013",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCNT-0014",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCMP-0015",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCMP-0016",
      template: "GT-003",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PAIR-0013",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PAIR-0014",
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PATT-0015",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PATT-0016",
      template: "GT-005",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
  ],
};
