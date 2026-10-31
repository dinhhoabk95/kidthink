import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GRD_03_IDENTITY: SkillIdentity = {
  code: "C2.GRD.03",
  strand_code: "C2.GRD",
  competency_code: "C2",
  name: "Tìm ô theo hàng – cột",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "match"],
  tier: "advanced",
  prerequisites: ["C2.GRD.01"],
  learning_objectives: [
    {
      code: "LO-C2.GRD.03-01",
      behaviour: "Nhận biết và thực hành Tìm ô theo hàng – cột ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GRD.03-02",
      behaviour: "Vận dụng Tìm ô theo hàng – cột trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GRD.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm ô theo hàng – cột",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GRD_03_DATASET: SkillDataset = {
  skill_code: "C2.GRD.03",
  concept_label: "Tìm ô theo hàng – cột",
  surface: "game",
  items: [
    {
      id: "row_marker_flag",
      label: "cờ hiệu hàng ngang",
      image: {
        kind: "emoji",
        ref: "🚩",
      },
      category: {
        type: "mốc hàng ngang",
      },
      contrast_group: "row_marker",
      value: 1,
      ordering: 1,
    },
    {
      id: "row_marker_pin",
      label: "ghim định vị hàng",
      image: {
        kind: "emoji",
        ref: "📍",
      },
      category: {
        type: "mốc hàng ngang",
      },
      contrast_group: "row_marker",
      value: 2,
      ordering: 2,
    },
    {
      id: "row_marker_star",
      label: "ngôi sao đánh dấu hàng",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "mốc hàng ngang",
      },
      contrast_group: "row_marker",
      value: 3,
      ordering: 3,
    },
    {
      id: "row_marker_target",
      label: "tâm điểm hàng ngang",
      image: {
        kind: "emoji",
        ref: "🎯",
      },
      category: {
        type: "mốc hàng ngang",
      },
      contrast_group: "row_marker",
      value: 4,
      ordering: 4,
    },
    {
      id: "col_marker_bell",
      label: "chuông báo cột dọc",
      image: {
        kind: "emoji",
        ref: "🔔",
      },
      category: {
        type: "mốc cột dọc",
      },
      contrast_group: "col_marker",
      value: 5,
      ordering: 5,
    },
    {
      id: "col_marker_gem",
      label: "viên ngọc cột dọc",
      image: {
        kind: "emoji",
        ref: "💎",
      },
      category: {
        type: "mốc cột dọc",
      },
      contrast_group: "col_marker",
      value: 6,
      ordering: 6,
    },
    {
      id: "col_marker_key",
      label: "chìa khóa cột dọc",
      image: {
        kind: "emoji",
        ref: "🔑",
      },
      category: {
        type: "mốc cột dọc",
      },
      contrast_group: "col_marker",
      value: 7,
      ordering: 7,
    },
    {
      id: "col_marker_crown",
      label: "vương miện cột dọc",
      image: {
        kind: "emoji",
        ref: "👑",
      },
      category: {
        type: "mốc cột dọc",
      },
      contrast_group: "col_marker",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "row_marker_flag",
      target_id: "col_marker_bell",
    },
    {
      type: "pair",
      source_id: "row_marker_pin",
      target_id: "col_marker_gem",
    },
    {
      type: "pair",
      source_id: "row_marker_star",
      target_id: "col_marker_key",
    },
    {
      type: "pair",
      source_id: "row_marker_target",
      target_id: "col_marker_crown",
    },
    {
      type: "contrast",
      source_id: "row_marker_flag",
      target_id: "col_marker_bell",
    },
  ],
  axes: {
    category: {
      values: ["mốc hàng ngang", "mốc cột dọc"],
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
      description: "Làm quen cơ bản với Tìm ô theo hàng – cột",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm ô theo hàng – cột",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tìm ô theo hàng – cột nhé",
  },
  ordering: [
    "row_marker_flag",
    "row_marker_pin",
    "row_marker_star",
    "row_marker_target",
    "col_marker_bell",
    "col_marker_gem",
    "col_marker_key",
    "col_marker_crown",
  ],
};

export const C2_GRD_03_SEED: SkillSeed = {
  identity: C2_GRD_03_IDENTITY,
  dataset: C2_GRD_03_DATASET,
  levels: [
    {
      code: "GL-C2-GRD-ROT-0001",
      template: "GT-019",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-ROT-0002",
      template: "GT-019",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-GRD-FLIP-0001",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
