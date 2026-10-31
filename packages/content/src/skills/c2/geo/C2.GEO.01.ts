import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_01_IDENTITY: SkillIdentity = {
  code: "C2.GEO.01",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Hình tròn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.GEO.01-01",
      behaviour: "Nhận biết và thực hành Hình tròn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GEO.01-02",
      behaviour: "Vận dụng Hình tròn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GEO.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hình tròn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GEO_01_DATASET: SkillDataset = {
  skill_code: "C2.GEO.01",
  concept_label: "Hình tròn",
  surface: "game",
  items: [
    {
      id: "circle_red",
      label: "hình tròn đỏ",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "hình tròn",
      },
      contrast_group: "circle",
      value: 1,
      ordering: 1,
    },
    {
      id: "clock_round",
      label: "đồng hồ tròn",
      image: {
        kind: "emoji",
        ref: "🕒",
      },
      category: {
        type: "hình tròn",
      },
      contrast_group: "circle",
      value: 2,
      ordering: 2,
    },
    {
      id: "ball_round",
      label: "quả bóng tròn",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "hình tròn",
      },
      contrast_group: "circle",
      value: 3,
      ordering: 3,
    },
    {
      id: "wheel_round",
      label: "bánh xe tròn",
      image: {
        kind: "emoji",
        ref: "🛞",
      },
      category: {
        type: "hình tròn",
      },
      contrast_group: "circle",
      value: 4,
      ordering: 4,
    },
    {
      id: "square_blue",
      label: "hình vuông xanh",
      image: {
        kind: "emoji",
        ref: "🟦",
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
      label: "hình tam giác đỏ",
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
      id: "book_rect",
      label: "quyển sách chữ nhật",
      image: {
        kind: "emoji",
        ref: "📗",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 7,
      ordering: 7,
    },
    {
      id: "star_yellow",
      label: "ngôi sao năm cánh",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 8,
      ordering: 8,
    },
    {
      id: "geo_circle_blue",
      label: "hình tròn lam",
      image: {
        kind: "emoji",
        ref: "🔵",
      },
      category: {
        type: "hình tròn",
      },
      contrast_group: "circle",
      value: 9,
      ordering: 9,
    },
    {
      id: "geo_circle_green",
      label: "hình tròn lục",
      image: {
        kind: "emoji",
        ref: "🟢",
      },
      category: {
        type: "hình tròn",
      },
      contrast_group: "circle",
      value: 10,
      ordering: 10,
    },
    {
      id: "obj_sun_shining",
      label: "mặt trời tròn",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "hình tròn",
      },
      contrast_group: "circle",
      value: 11,
      ordering: 11,
    },
    {
      id: "obj_doughnut_round",
      label: "bánh donut tròn",
      image: {
        kind: "emoji",
        ref: "🍩",
      },
      category: {
        type: "hình tròn",
      },
      contrast_group: "circle",
      value: 12,
      ordering: 12,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "circle_red",
      target_id: "square_blue",
    },
    {
      type: "pair",
      source_id: "clock_round",
      target_id: "triangle_red",
    },
    {
      type: "pair",
      source_id: "ball_round",
      target_id: "book_rect",
    },
    {
      type: "pair",
      source_id: "wheel_round",
      target_id: "star_yellow",
    },
    {
      type: "pair",
      source_id: "geo_circle_blue",
      target_id: "obj_sun_shining",
    },
    {
      type: "pair",
      source_id: "geo_circle_green",
      target_id: "obj_doughnut_round",
    },
    {
      type: "contrast",
      source_id: "circle_red",
      target_id: "square_blue",
    },
  ],
  axes: {
    category: {
      values: ["hình tròn", "hình khác"],
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
      description: "Làm quen cơ bản với Hình tròn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình tròn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hình tròn nhé",
  },
  ordering: [
    "circle_red",
    "clock_round",
    "ball_round",
    "wheel_round",
    "square_blue",
    "triangle_red",
    "book_rect",
    "star_yellow",
    "geo_circle_blue",
    "geo_circle_green",
    "obj_sun_shining",
    "obj_doughnut_round",
  ],
};

/**
 * Chủ đề làm quen — dataset của bài học mở đầu GL-C2-GEO-INTRO-0001.
 *
 * Chủ đề không có hàng `skills` riêng (`BR-CTM-01`): nó sống trên chính level dạy
 * qua `SkillLevelPlan.dataset`. Trước 2026-09-06 dataset này treo ở kỹ năng bậc
 * `pre` C2_GEO_09, kỹ năng đó đã bị gỡ.
 */
const TOPIC_PLANAR_SHAPES_DATASET: SkillDataset = {
  skill_code: "C2.GEO.01",
  concept_label: "Làm quen hình phẳng",
  surface: "game",
  items: [
    {
      id: "circle",
      label: "hình tròn",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "square",
      label: "hình vuông",
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "triangle",
      label: "hình tam giác",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "rectangle",
      label: "hình chữ nhật",
      image: {
        kind: "emoji",
        ref: "🟧",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "oval",
      label: "hình bầu dục",
      image: {
        kind: "emoji",
        ref: "🥚",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "diamond",
      label: "hình thoi",
      image: {
        kind: "emoji",
        ref: "🔶",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "star",
      label: "hình ngôi sao",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "hình học",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Giới thiệu 7 hình phẳng qua tai và mắt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng hình phẳng",
    },
    {
      rung: 3,
      dimension: "range",
      description: "Gọi tên và phân biệt các hình phẳng",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy làm quen với các hình phẳng nhé!",
    narration_template:
      "Chúng mình cùng làm quen với các hình phẳng cơ bản nhé",
  },
  ordering: [
    "circle",
    "square",
    "triangle",
    "rectangle",
    "oval",
    "diamond",
    "star",
  ],
};

export const C2_GEO_01_SEED: SkillSeed = {
  identity: C2_GEO_01_IDENTITY,
  dataset: C2_GEO_01_DATASET,
  levels: [
    {
      code: "GL-C2-GEO-INTRO-0001",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      dataset: TOPIC_PLANAR_SHAPES_DATASET,
      sequence_no: 1,
      skill_codes: [
        "C2.GEO.01",
        "C2.GEO.02",
        "C2.GEO.03",
        "C2.GEO.04",
        "C2.GEO.05",
        "C2.GEO.06",
        "C2.GEO.07",
        "C2.GEO.08",
      ],
    },
    {
      code: "GL-C2-SHP-CARD-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-SHP-CARD-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-SHP-CARD-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-CMP-SIZ-0008",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-SEQ-PAT-0018",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-COMP-0024",
      template: "GT-021",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-COMP-0025",
      template: "GT-021",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-MIR-COMP-0026",
      template: "GT-021",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-SHP-FLIP-0030",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-MATCH-0101",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "home",
      rounds: 3,
      montessori_ref: "WB19-D1",
    },
    {
      code: "GL-C2-GEO-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TAP-0290",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "town",
      rounds: 3,
      montessori_ref: "WB19-D1",
    },
    {
      code: "GL-C2-GEO-PAIR-0291",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "home",
      rounds: 3,
      montessori_ref: "WB19-D4",
    },
    {
      code: "GL-C2-GEO-TAP-0292",
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
