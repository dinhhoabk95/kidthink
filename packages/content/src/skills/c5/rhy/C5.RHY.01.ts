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
      id: "rhy_ga",
      label: "tiếng gà (con gà)",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "tiếng vần a",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "rhy_nha",
      label: "tiếng nhà (ngôi nhà)",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "tiếng vần a",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "rhy_ca",
      label: "tiếng cá (con cá)",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "tiếng vần a",
      },
      value: 3,
      contrast_group: "primary",
    },
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
      value: 4,
      contrast_group: "contrast",
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
      value: 5,
      contrast_group: "contrast",
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
      value: 6,
      contrast_group: "contrast",
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
  },
  ordering: ["rhy_ga", "rhy_nha", "rhy_ca", "rhy_hoa", "rhy_loa", "rhy_khoa"],
  axes: {
    category: {
      values: ["tiếng vần a", "tiếng vần oa"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rhy_ga",
      target_id: "rhy_nha",
    },
    {
      type: "pair",
      source_id: "rhy_hoa",
      target_id: "rhy_loa",
    },
    {
      type: "contrast",
      source_id: "rhy_ga",
      target_id: "rhy_hoa",
    },
  ],
};

export const C5_RHY_01_SEED: SkillSeed = {
  identity: C5_RHY_01_IDENTITY,
  dataset: C5_RHY_01_DATASET,
  levels: [
    {
      code: "GL-C5-RHY-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
