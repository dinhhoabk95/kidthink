import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GRD_05_IDENTITY: SkillIdentity = {
  code: "C2.GRD.05",
  strand_code: "C2.GRD",
  competency_code: "C2",
  name: "Ghi lại đường đi bằng ô",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["plan", "create"],
  tier: "advanced",
  prerequisites: ["C2.GRD.02", "C2.GRD.03"],
  learning_objectives: [
    {
      code: "LO-C2.GRD.05-01",
      behaviour: "Nhận biết và thực hành Ghi lại đường đi bằng ô ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GRD.05-02",
      behaviour: "Vận dụng Ghi lại đường đi bằng ô trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GRD.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Ghi lại đường đi bằng ô",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GRD_05_DATASET: SkillDataset = {
  skill_code: "C2.GRD.05",
  concept_label: "Ghi lại đường đi bằng ô",
  surface: "game",
  items: [
    {
      id: "step_forward",
      label: "bước tiến về trước",
      image: {
        kind: "emoji",
        ref: "⬆️",
      },
      category: {
        type: "ký hiệu bước",
      },
      contrast_group: "step_symbol",
      value: 1,
      ordering: 1,
    },
    {
      id: "step_turn_right",
      label: "bước rẽ sang phải",
      image: {
        kind: "emoji",
        ref: "➡️",
      },
      category: {
        type: "ký hiệu bước",
      },
      contrast_group: "step_symbol",
      value: 2,
      ordering: 2,
    },
    {
      id: "step_footprint",
      label: "vết chân trên ô",
      image: {
        kind: "emoji",
        ref: "👣",
      },
      category: {
        type: "ký hiệu bước",
      },
      contrast_group: "step_symbol",
      value: 3,
      ordering: 3,
    },
    {
      id: "step_shoes",
      label: "đôi giày bước đi",
      image: {
        kind: "emoji",
        ref: "👟",
      },
      category: {
        type: "ký hiệu bước",
      },
      contrast_group: "step_symbol",
      value: 4,
      ordering: 4,
    },
    {
      id: "mark_start_post",
      label: "vạch xuất phát",
      image: {
        kind: "emoji",
        ref: "🏁",
      },
      category: {
        type: "mốc hành trình",
      },
      contrast_group: "milestone",
      value: 5,
      ordering: 5,
    },
    {
      id: "mark_mid_flag",
      label: "cờ mốc giữa đường",
      image: {
        kind: "emoji",
        ref: "🚩",
      },
      category: {
        type: "mốc hành trình",
      },
      contrast_group: "milestone",
      value: 6,
      ordering: 6,
    },
    {
      id: "mark_bell_post",
      label: "chuông điểm danh",
      image: {
        kind: "emoji",
        ref: "🔔",
      },
      category: {
        type: "mốc hành trình",
      },
      contrast_group: "milestone",
      value: 7,
      ordering: 7,
    },
    {
      id: "mark_finish_star",
      label: "ngôi sao đích đến",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "mốc hành trình",
      },
      contrast_group: "milestone",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "step_forward",
      target_id: "mark_start_post",
    },
    {
      type: "pair",
      source_id: "step_turn_right",
      target_id: "mark_mid_flag",
    },
    {
      type: "pair",
      source_id: "step_footprint",
      target_id: "mark_bell_post",
    },
    {
      type: "pair",
      source_id: "step_shoes",
      target_id: "mark_finish_star",
    },
    {
      type: "contrast",
      source_id: "step_forward",
      target_id: "mark_start_post",
    },
  ],
  axes: {
    category: {
      values: ["ký hiệu bước", "mốc hành trình"],
    },
    order: {
      values: ["1", "2", "3", "4", "5", "6", "7", "8"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ghi lại đường đi bằng ô",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghi lại đường đi bằng ô",
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
      "Chúng mình cùng tìm hiểu về Ghi lại đường đi bằng ô nhé",
  },
  ordering: [
    "step_forward",
    "step_turn_right",
    "step_footprint",
    "step_shoes",
    "mark_start_post",
    "mark_mid_flag",
    "mark_bell_post",
    "mark_finish_star",
  ],
};

export const C2_GRD_05_SEED: SkillSeed = {
  identity: C2_GRD_05_IDENTITY,
  dataset: C2_GRD_05_DATASET,
  levels: [
    {
      code: "GL-C2-GRD-SORT-0007",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-SORT-0008",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-WEAVE-0001",
      template: "GT-033",
      band: "5-6",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
  ],
};
