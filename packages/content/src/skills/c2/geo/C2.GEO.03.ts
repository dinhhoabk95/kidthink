import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_03_IDENTITY: SkillIdentity = {
  code: "C2.GEO.03",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Hình tam giác",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.GEO.03-01",
      behaviour: "Nhận biết và thực hành Hình tam giác ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GEO.03-02",
      behaviour: "Vận dụng Hình tam giác trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GEO.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hình tam giác",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GEO_03_DATASET: SkillDataset = {
  skill_code: "C2.GEO.03",
  concept_label: "Hình tam giác",
  surface: "game",
  items: [
    {
      id: "triangle_red",
      label: "hình tam giác đỏ",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "hình tam giác",
      },
      contrast_group: "triangle",
      value: 1,
      ordering: 1,
    },
    {
      id: "ruler_triangle",
      label: "thước ê-ke tam giác",
      image: {
        kind: "emoji",
        ref: "📐",
      },
      category: {
        type: "hình tam giác",
      },
      contrast_group: "triangle",
      value: 2,
      ordering: 2,
    },
    {
      id: "watermelon_slice",
      label: "miếng dưa hấu tam giác",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hình tam giác",
      },
      contrast_group: "triangle",
      value: 3,
      ordering: 3,
    },
    {
      id: "tent_triangle",
      label: "lều vải tam giác",
      image: {
        kind: "emoji",
        ref: "⛺",
      },
      category: {
        type: "hình tam giác",
      },
      contrast_group: "triangle",
      value: 4,
      ordering: 4,
    },
    {
      id: "circle_blue",
      label: "hình tròn xanh",
      image: {
        kind: "emoji",
        ref: "🔵",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 5,
      ordering: 5,
    },
    {
      id: "square_purple",
      label: "hình vuông tím",
      image: {
        kind: "emoji",
        ref: "🟪",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 6,
      ordering: 6,
    },
    {
      id: "rhombus_blue",
      label: "hình thoi xanh",
      image: {
        kind: "emoji",
        ref: "🔷",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 7,
      ordering: 7,
    },
    {
      id: "ball_basketball",
      label: "quả bóng tròn",
      image: {
        kind: "emoji",
        ref: "🏀",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 8,
      ordering: 8,
    },
    {
      id: "geo_triangle_pink",
      label: "hình tam giác hồng",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "hình tam giác",
      },
      contrast_group: "triangle",
      value: 9,
      ordering: 9,
    },
    {
      id: "obj_pizza_slice",
      label: "miếng pizza tam giác",
      image: {
        kind: "emoji",
        ref: "🍕",
      },
      category: {
        type: "hình tam giác",
      },
      contrast_group: "triangle",
      value: 10,
      ordering: 10,
    },
    {
      id: "obj_wind_kite",
      label: "con diều tam giác",
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      category: {
        type: "hình tam giác",
      },
      contrast_group: "triangle",
      value: 11,
      ordering: 11,
    },
    {
      id: "obj_traffic_sign",
      label: "biển báo tam giác",
      image: {
        kind: "emoji",
        ref: "⚠️",
      },
      category: {
        type: "hình tam giác",
      },
      contrast_group: "triangle",
      value: 12,
      ordering: 12,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "triangle_red",
      target_id: "circle_blue",
    },
    {
      type: "pair",
      source_id: "ruler_triangle",
      target_id: "square_purple",
    },
    {
      type: "pair",
      source_id: "watermelon_slice",
      target_id: "rhombus_blue",
    },
    {
      type: "pair",
      source_id: "tent_triangle",
      target_id: "ball_basketball",
    },
    {
      type: "pair",
      source_id: "geo_triangle_pink",
      target_id: "circle_blue",
    },
    {
      type: "pair",
      source_id: "obj_pizza_slice",
      target_id: "square_purple",
    },
    {
      type: "contrast",
      source_id: "triangle_red",
      target_id: "circle_blue",
    },
  ],
  axes: {
    category: {
      values: ["hình tam giác", "hình khác"],
    },
    order: {
      values: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Hình tam giác",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình tam giác",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hình tam giác nhé",
  },
  ordering: [
    "triangle_red",
    "ruler_triangle",
    "watermelon_slice",
    "tent_triangle",
    "circle_blue",
    "square_purple",
    "rhombus_blue",
    "ball_basketball",
    "geo_triangle_pink",
    "obj_pizza_slice",
    "obj_wind_kite",
    "obj_traffic_sign",
  ],
};

export const C2_GEO_03_SEED: SkillSeed = {
  identity: C2_GEO_03_IDENTITY,
  dataset: C2_GEO_03_DATASET,
  levels: [
    {
      code: "GL-C2-GEO-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TAP-0296",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "town",
      rounds: 3,
      montessori_ref: "WB19-D1",
    },
    {
      code: "GL-C2-GEO-PAIR-0297",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "food",
      rounds: 3,
      montessori_ref: "WB19-D4",
    },
    {
      code: "GL-C2-GEO-TAP-0298",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB19-D1",
    },
  ],
};
