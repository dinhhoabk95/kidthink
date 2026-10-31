import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_02_IDENTITY: SkillIdentity = {
  code: "C2.GEO.02",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Hình vuông",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.GEO.02-01",
      behaviour: "Nhận biết và thực hành Hình vuông ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GEO.02-02",
      behaviour: "Vận dụng Hình vuông trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GEO.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hình vuông",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GEO_02_DATASET: SkillDataset = {
  skill_code: "C2.GEO.02",
  concept_label: "Hình vuông",
  surface: "game",
  items: [
    {
      id: "square_blue",
      label: "hình vuông xanh",
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "hình vuông",
      },
      contrast_group: "square",
      value: 1,
      ordering: 1,
    },
    {
      id: "square_orange",
      label: "hình vuông cam",
      image: {
        kind: "emoji",
        ref: "🟧",
      },
      category: {
        type: "hình vuông",
      },
      contrast_group: "square",
      value: 2,
      ordering: 2,
    },
    {
      id: "frame_square",
      label: "khung ảnh vuông",
      image: {
        kind: "emoji",
        ref: "🖼️",
      },
      category: {
        type: "hình vuông",
      },
      contrast_group: "square",
      value: 3,
      ordering: 3,
    },
    {
      id: "gift_square",
      label: "hộp quà vuông",
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "hình vuông",
      },
      contrast_group: "square",
      value: 4,
      ordering: 4,
    },
    {
      id: "circle_red",
      label: "hình tròn đỏ",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 5,
      ordering: 5,
    },
    {
      id: "triangle_red",
      label: "hình tam giác",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 6,
      ordering: 6,
    },
    {
      id: "rhombus_orange",
      label: "hình thoi cam",
      image: {
        kind: "emoji",
        ref: "🔶",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 7,
      ordering: 7,
    },
    {
      id: "moon_crescent",
      label: "mặt trăng khuyết",
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 8,
      ordering: 8,
    },
    {
      id: "geo_square_yellow",
      label: "hình vuông vàng",
      image: {
        kind: "emoji",
        ref: "🟨",
      },
      category: {
        type: "hình vuông",
      },
      contrast_group: "square",
      value: 9,
      ordering: 9,
    },
    {
      id: "obj_window_frame",
      label: "khung cửa sổ vuông",
      image: {
        kind: "emoji",
        ref: "🪟",
      },
      category: {
        type: "hình vuông",
      },
      contrast_group: "square",
      value: 10,
      ordering: 10,
    },
    {
      id: "obj_brick_tile",
      label: "viên gạch lát sàn",
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "hình vuông",
      },
      contrast_group: "square",
      value: 11,
      ordering: 11,
    },
    {
      id: "geo_square_rotated_45",
      label: "hình vuông xoay nghiêng",
      image: {
        kind: "emoji",
        ref: "💠",
      },
      category: {
        type: "hình vuông",
      },
      contrast_group: "square",
      value: 12,
      ordering: 12,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "square_blue",
      target_id: "circle_red",
    },
    {
      type: "pair",
      source_id: "square_orange",
      target_id: "triangle_red",
    },
    {
      type: "pair",
      source_id: "frame_square",
      target_id: "rhombus_orange",
    },
    {
      type: "pair",
      source_id: "gift_square",
      target_id: "moon_crescent",
    },
    {
      type: "pair",
      source_id: "geo_square_yellow",
      target_id: "obj_window_frame",
    },
    {
      type: "pair",
      source_id: "geo_square_rotated_45",
      target_id: "obj_brick_tile",
    },
    {
      type: "contrast",
      source_id: "square_blue",
      target_id: "circle_red",
    },
  ],
  axes: {
    category: {
      values: ["hình vuông", "hình khác"],
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
      description: "Làm quen cơ bản với Hình vuông",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình vuông",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hình vuông nhé",
  },
  ordering: [
    "square_blue",
    "square_orange",
    "frame_square",
    "gift_square",
    "circle_red",
    "triangle_red",
    "rhombus_orange",
    "moon_crescent",
    "geo_square_yellow",
    "obj_window_frame",
    "obj_brick_tile",
    "geo_square_rotated_45",
  ],
};

export const C2_GEO_02_SEED: SkillSeed = {
  identity: C2_GEO_02_IDENTITY,
  dataset: C2_GEO_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C2-GEO-MATCH-0102",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "home",
      rounds: 3,
      montessori_ref: "WB19-D1",
    },
    {
      code: "GL-C2-SHP-BSK-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-SHP-BSK-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TAP-0293",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "town",
      rounds: 3,
      montessori_ref: "WB19-D1",
    },
    {
      code: "GL-C2-GEO-PAIR-0294",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "home",
      rounds: 3,
      montessori_ref: "WB19-D4",
    },
    {
      code: "GL-C2-GEO-SLOT-0295",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB19-D1",
    },
  ],
};
