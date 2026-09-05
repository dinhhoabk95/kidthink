import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_08_IDENTITY: SkillIdentity = {
  code: "C5.RHY.08",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Tự nghĩ tiếng cùng vần",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["create", "listen"],
  tier: "advanced",
  prerequisites: ["C5.RHY.02"],
  learning_objectives: [
    {
      code: "LO-C5.RHY.08-01",
      behaviour: "Nhận biết và thực hành Tự nghĩ tiếng cùng vần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RHY.08-02",
      behaviour: "Vận dụng Tự nghĩ tiếng cùng vần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RHY.08-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tự nghĩ tiếng cùng vần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RHY_08_DATASET: SkillDataset = {
  skill_code: "C5.RHY.08",
  concept_label: "Tự nghĩ tiếng cùng vần",
  surface: "game",
  items: [
    {
      id: "let_e",
      label: "chữ e",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ê",
      label: "chữ ê",
      glyph: "ê",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "contrast",
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tự nghĩ tiếng cùng vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự nghĩ tiếng cùng vần",
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
      "Chúng mình cùng tìm hiểu về Tự nghĩ tiếng cùng vần nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_e", "let_ê", "let_g", "let_h", "let_i"],
};

export const C5_RHY_08_SEED: SkillSeed = {
  identity: C5_RHY_08_IDENTITY,
  dataset: C5_RHY_08_DATASET,
  levels: [
    {
      code: "GL-C5-RHY-FRAC-0001",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-FRAC-0002",
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-FRAC-0003",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-FRAC-0004",
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-FRAC-0005",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-FOLD-0001",
      template: "GT-036",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-FOLD-0002",
      template: "GT-036",
      band: "5-6",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-FOLD-0003",
      template: "GT-036",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-FOLD-0004",
      template: "GT-036",
      band: "5-6",
      difficulty: 5,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-FOLD-0005",
      template: "GT-036",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
  ],
};
