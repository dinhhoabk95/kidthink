import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_08_IDENTITY: SkillIdentity = {
  code: "C5.RHY.08",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Tự nghĩ tiếng cùng vần",
  age_min: 5,
  age_max: 6,
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
      id: "rhy_hoa",
      label: "tiếng hoa (bông hoa)",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "tiếng vần oa",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "rhy_loa",
      label: "tiếng loa (cái loa)",
      image: {
        kind: "emoji",
        ref: "📢",
      },
      category: {
        type: "tiếng vần oa",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "rhy_khoa",
      label: "tiếng khóa (ổ khóa)",
      image: {
        kind: "emoji",
        ref: "🔒",
      },
      category: {
        type: "tiếng vần oa",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "rhy_meo",
      label: "tiếng mèo (con mèo)",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "tiếng vần eo",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "rhy_keo",
      label: "tiếng kẹo (viên kẹo)",
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      category: {
        type: "tiếng vần eo",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "rhy_keo_cat",
      label: "tiếng kéo (cái kéo)",
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "tiếng vần eo",
      },
      value: 6,
      contrast_group: "contrast",
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
  },
  ordering: [
    "rhy_hoa",
    "rhy_loa",
    "rhy_khoa",
    "rhy_meo",
    "rhy_keo",
    "rhy_keo_cat",
  ],
  axes: {
    category: {
      values: ["tiếng vần oa", "tiếng vần eo"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rhy_hoa",
      target_id: "rhy_loa",
    },
    {
      type: "pair",
      source_id: "rhy_meo",
      target_id: "rhy_keo",
    },
    {
      type: "contrast",
      source_id: "rhy_hoa",
      target_id: "rhy_meo",
    },
  ],
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
