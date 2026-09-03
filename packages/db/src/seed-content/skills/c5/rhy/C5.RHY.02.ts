import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_02_IDENTITY: SkillIdentity = {
  code: "C5.RHY.02",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Tìm tiếng cùng vần trong nhóm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "match"],
  tier: "advanced",
  prerequisites: ["C5.RHY.01"],
  learning_objectives: [
    {
      code: "LO-C5.RHY.02-01",
      behaviour:
        "Nhận biết và thực hành Tìm tiếng cùng vần trong nhóm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RHY.02-02",
      behaviour:
        "Vận dụng Tìm tiếng cùng vần trong nhóm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RHY.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm tiếng cùng vần trong nhóm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RHY_02_DATASET: SkillDataset = {
  skill_code: "C5.RHY.02",
  concept_label: "Tìm tiếng cùng vần trong nhóm",
  surface: "game",
  items: [
    {
      id: "let_ă",
      label: "chữ ă",
      glyph: "ă",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_â",
      label: "chữ â",
      glyph: "â",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_b",
      label: "chữ b",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🅱️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_c",
      label: "chữ c",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🅲",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_d",
      label: "chữ d",
      glyph: "d",
      image: {
        kind: "emoji",
        ref: "🅳",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm tiếng cùng vần trong nhóm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm tiếng cùng vần trong nhóm",
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
      "Chúng mình cùng tìm hiểu về Tìm tiếng cùng vần trong nhóm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_ă", "let_â", "let_b", "let_c", "let_d"],
};

export const C5_RHY_02_SEED: SkillSeed = {
  identity: C5_RHY_02_IDENTITY,
  dataset: C5_RHY_02_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
