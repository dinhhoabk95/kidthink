import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_01_IDENTITY: SkillIdentity = {
  code: "C5.RHY.01",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Nghe ra hai tiếng cùng vần",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "match"],
  tier: "core",
  prerequisites: ["C5.PHO.01"],
  learning_objectives: [
    {
      code: "LO-C5.RHY.01-01",
      behaviour:
        "Nhận biết và thực hành Nghe ra hai tiếng cùng vần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RHY.01-02",
      behaviour:
        "Vận dụng Nghe ra hai tiếng cùng vần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RHY.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nghe ra hai tiếng cùng vần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RHY_01_DATASET: SkillDataset = {
  skill_code: "C5.RHY.01",
  concept_label: "Nghe ra hai tiếng cùng vần",
  surface: "game",
  items: [
    {
      id: "let_a",
      label: "chữ a",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ă",
      label: "chữ ă",
      glyph: "ă",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_â",
      label: "chữ â",
      glyph: "â",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_b",
      label: "chữ b",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🅱️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_c",
      label: "chữ c",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🅲",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe ra hai tiếng cùng vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe ra hai tiếng cùng vần",
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
      "Chúng mình cùng tìm hiểu về Nghe ra hai tiếng cùng vần nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_a", "let_ă", "let_â", "let_b", "let_c"],
};

export const C5_RHY_01_SEED: SkillSeed = {
  identity: C5_RHY_01_IDENTITY,
  dataset: C5_RHY_01_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
