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
      id: "rhy_meo",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "tiếng vần eo",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "rhy_keo",
      label: "viên kẹo",
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      category: {
        type: "tiếng vần eo",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "rhy_keo_cat",
      label: "cái kéo",
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "tiếng vần eo",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "rhy_sao",
      label: "ngôi sao",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "tiếng vần ao",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "rhy_cao",
      label: "con cáo",
      image: {
        kind: "emoji",
        ref: "🦊",
      },
      category: {
        type: "tiếng vần ao",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "rhy_dao",
      label: "quả đào",
      image: {
        kind: "emoji",
        ref: "🍑",
      },
      category: {
        type: "tiếng vần ao",
      },
      value: 6,
      contrast_group: "contrast",
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
  },
  ordering: [
    "rhy_meo",
    "rhy_keo",
    "rhy_keo_cat",
    "rhy_sao",
    "rhy_cao",
    "rhy_dao",
  ],
  axes: {
    category: {
      values: ["tiếng vần eo", "tiếng vần ao"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rhy_meo",
      target_id: "rhy_keo",
    },
    {
      type: "pair",
      source_id: "rhy_sao",
      target_id: "rhy_cao",
    },
    {
      type: "contrast",
      source_id: "rhy_meo",
      target_id: "rhy_sao",
    },
  ],
};

export const C5_RHY_02_SEED: SkillSeed = {
  identity: C5_RHY_02_IDENTITY,
  dataset: C5_RHY_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "home",
    },
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
    },
    {
      template: "GT-003",
      band: "5-6",
      difficulty: 1,
      theme: "nature",
    },
  ],
};
