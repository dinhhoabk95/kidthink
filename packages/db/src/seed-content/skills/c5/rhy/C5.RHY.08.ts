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
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-036",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
  ],
};
