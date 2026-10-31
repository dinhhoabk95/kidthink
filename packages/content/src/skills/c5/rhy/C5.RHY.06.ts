import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_06_IDENTITY: SkillIdentity = {
  code: "C5.RHY.06",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Vần có âm đệm: oa · oe · uy",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["solve", "observe"],
  tier: "advanced",
  prerequisites: ["C5.RHY.04", "C5.RIM.05"],
  learning_objectives: [
    {
      code: "LO-C5.RHY.06-01",
      behaviour:
        "Nhận biết và thực hành Vần có âm đệm: oa · oe · uy ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RHY.06-02",
      behaviour:
        "Vận dụng Vần có âm đệm: oa · oe · uy trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RHY.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Vần có âm đệm: oa · oe · uy",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RHY_06_DATASET: SkillDataset = {
  skill_code: "C5.RHY.06",
  concept_label: "Vần có âm đệm: oa · oe · uy",
  surface: "game",
  items: [
    {
      id: "rhy_oa",
      label: "vần oa (bông hoa)",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "vần đệm một",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "rhy_oe",
      label: "vần oe (chích chòe)",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "vần đệm một",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "rhy_uy",
      label: "vần uy (tàu thủy)",
      image: {
        kind: "emoji",
        ref: "🚢",
      },
      category: {
        type: "vần đệm một",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "rhy_ue",
      label: "vần uê (hoa huệ)",
      image: {
        kind: "emoji",
        ref: "💮",
      },
      category: {
        type: "vần đệm hai",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "rhy_uo",
      label: "vần uơ (quơ tay)",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "vần đệm hai",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "rhy_uya",
      label: "vần uya (đêm khuya)",
      image: {
        kind: "emoji",
        ref: "🌌",
      },
      category: {
        type: "vần đệm hai",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vần có âm đệm: oa · oe · uy",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vần có âm đệm: oa · oe · uy",
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
      "Chúng mình cùng tìm hiểu về Vần có âm đệm: oa · oe · uy nhé",
  },
  ordering: ["rhy_oa", "rhy_oe", "rhy_uy", "rhy_ue", "rhy_uo", "rhy_uya"],
  axes: {
    category: {
      values: ["vần đệm một", "vần đệm hai"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rhy_oa",
      target_id: "rhy_oe",
    },
    {
      type: "pair",
      source_id: "rhy_ue",
      target_id: "rhy_uo",
    },
    {
      type: "contrast",
      source_id: "rhy_oa",
      target_id: "rhy_ue",
    },
  ],
};

export const C5_RHY_06_SEED: SkillSeed = {
  identity: C5_RHY_06_IDENTITY,
  dataset: C5_RHY_06_DATASET,
  levels: [
    {
      code: "GL-C5-RHY-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-TCNT-0005",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
  ],
};
