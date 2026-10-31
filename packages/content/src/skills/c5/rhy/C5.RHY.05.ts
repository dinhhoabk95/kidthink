import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_05_IDENTITY: SkillIdentity = {
  code: "C5.RHY.05",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Vần có âm cuối: an · am · ang · ac",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["solve", "observe"],
  tier: "advanced",
  prerequisites: ["C5.RHY.04", "C5.RIM.02", "C5.RIM.03"],
  learning_objectives: [
    {
      code: "LO-C5.RHY.05-01",
      behaviour:
        "Nhận biết và thực hành Vần có âm cuối: an · am · ang · ac ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RHY.05-02",
      behaviour:
        "Vận dụng Vần có âm cuối: an · am · ang · ac trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RHY.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Vần có âm cuối: an · am · ang · ac",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RHY_05_DATASET: SkillDataset = {
  skill_code: "C5.RHY.05",
  concept_label: "Vần có âm cuối: an · am · ang · ac",
  surface: "game",
  items: [
    {
      id: "rhy_an",
      label: "vần an (cái bàn)",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "vần mũi vang",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "rhy_am",
      label: "vần am (quả cam)",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "vần mũi vang",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "rhy_ang",
      label: "vần ang (cái bảng)",
      image: {
        kind: "emoji",
        ref: "📋",
      },
      category: {
        type: "vần mũi vang",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "rhy_ac",
      label: "vần ac (chim hạc)",
      image: {
        kind: "emoji",
        ref: "🦩",
      },
      category: {
        type: "vần ngắt tắc",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "rhy_at",
      label: "vần at (cái bát)",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "vần ngắt tắc",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "rhy_ap",
      label: "vần ap (ngọn tháp)",
      image: {
        kind: "emoji",
        ref: "🗼",
      },
      category: {
        type: "vần ngắt tắc",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vần có âm cuối: an · am · ang · ac",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vần có âm cuối: an · am · ang · ac",
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
      "Chúng mình cùng tìm hiểu về Vần có âm cuối: an · am · ang · ac nhé",
  },
  ordering: ["rhy_an", "rhy_am", "rhy_ang", "rhy_ac", "rhy_at", "rhy_ap"],
  axes: {
    category: {
      values: ["vần mũi vang", "vần ngắt tắc"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rhy_an",
      target_id: "rhy_am",
    },
    {
      type: "pair",
      source_id: "rhy_ac",
      target_id: "rhy_at",
    },
    {
      type: "contrast",
      source_id: "rhy_an",
      target_id: "rhy_ac",
    },
  ],
};

export const C5_RHY_05_SEED: SkillSeed = {
  identity: C5_RHY_05_IDENTITY,
  dataset: C5_RHY_05_DATASET,
  levels: [
    {
      code: "GL-C5-RHY-TAP-0007",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TCNT-0003",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
  ],
};
