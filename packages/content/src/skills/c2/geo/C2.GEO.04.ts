import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_04_IDENTITY: SkillIdentity = {
  code: "C2.GEO.04",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Hình chữ nhật",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "compare"],
  tier: "basic",
  prerequisites: ["C2.GEO.02"],
  learning_objectives: [
    {
      code: "LO-C2.GEO.04-01",
      behaviour: "Nhận biết và thực hành Hình chữ nhật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.GEO.04-02",
      behaviour: "Vận dụng Hình chữ nhật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.GEO.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hình chữ nhật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_GEO_04_DATASET: SkillDataset = {
  skill_code: "C2.GEO.04",
  concept_label: "Hình chữ nhật",
  surface: "game",
  items: [
    {
      id: "book_rect",
      label: "quyển vở chữ nhật",
      image: {
        kind: "emoji",
        ref: "📗",
      },
      category: {
        type: "hình chữ nhật",
      },
      contrast_group: "rectangle",
      value: 1,
      ordering: 1,
    },
    {
      id: "door_rect",
      label: "cánh cửa chữ nhật",
      image: {
        kind: "emoji",
        ref: "🚪",
      },
      category: {
        type: "hình chữ nhật",
      },
      contrast_group: "rectangle",
      value: 2,
      ordering: 2,
    },
    {
      id: "envelope_rect",
      label: "phong bì chữ nhật",
      image: {
        kind: "emoji",
        ref: "✉️",
      },
      category: {
        type: "hình chữ nhật",
      },
      contrast_group: "rectangle",
      value: 3,
      ordering: 3,
    },
    {
      id: "tv_rect",
      label: "màn hình ti-vi chữ nhật",
      image: {
        kind: "emoji",
        ref: "📺",
      },
      category: {
        type: "hình chữ nhật",
      },
      contrast_group: "rectangle",
      value: 4,
      ordering: 4,
    },
    {
      id: "plate_round",
      label: "đĩa tròn",
      image: {
        kind: "emoji",
        ref: "🍽️",
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
      id: "sign_stop",
      label: "biển báo dừng",
      image: {
        kind: "emoji",
        ref: "🛑",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 7,
      ordering: 7,
    },
    {
      id: "orange_fruit",
      label: "quả cam tròn",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "hình khác",
      },
      contrast_group: "other_shape",
      value: 8,
      ordering: 8,
    },
    {
      id: "geo_rect_green_horiz",
      label: "hình chữ nhật nằm ngang",
      image: {
        kind: "emoji",
        ref: "🟩",
      },
      category: {
        type: "hình chữ nhật",
      },
      contrast_group: "rectangle",
      value: 9,
      ordering: 9,
    },
    {
      id: "geo_rect_orange_vert",
      label: "hình chữ nhật dựng đứng",
      image: {
        kind: "emoji",
        ref: "🟧",
      },
      category: {
        type: "hình chữ nhật",
      },
      contrast_group: "rectangle",
      value: 10,
      ordering: 10,
    },
    {
      id: "obj_book_red",
      label: "quyển sách chữ nhật",
      image: {
        kind: "emoji",
        ref: "📕",
      },
      category: {
        type: "hình chữ nhật",
      },
      contrast_group: "rectangle",
      value: 11,
      ordering: 11,
    },
    {
      id: "obj_blackboard",
      label: "bảng đen chữ nhật",
      image: {
        kind: "emoji",
        ref: "🪧",
      },
      category: {
        type: "hình chữ nhật",
      },
      contrast_group: "rectangle",
      value: 12,
      ordering: 12,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "book_rect",
      target_id: "plate_round",
    },
    {
      type: "pair",
      source_id: "door_rect",
      target_id: "triangle_red",
    },
    {
      type: "pair",
      source_id: "envelope_rect",
      target_id: "sign_stop",
    },
    {
      type: "pair",
      source_id: "tv_rect",
      target_id: "orange_fruit",
    },
    {
      type: "pair",
      source_id: "geo_rect_green_horiz",
      target_id: "plate_round",
    },
    {
      type: "pair",
      source_id: "geo_rect_orange_vert",
      target_id: "triangle_red",
    },
    {
      type: "contrast",
      source_id: "book_rect",
      target_id: "plate_round",
    },
  ],
  axes: {
    category: {
      values: ["hình chữ nhật", "hình khác"],
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
      description: "Làm quen cơ bản với Hình chữ nhật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hình chữ nhật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hình chữ nhật nhé",
  },
  ordering: [
    "book_rect",
    "door_rect",
    "envelope_rect",
    "tv_rect",
    "plate_round",
    "triangle_red",
    "sign_stop",
    "orange_fruit",
    "geo_rect_green_horiz",
    "geo_rect_orange_vert",
    "obj_book_red",
    "obj_blackboard",
  ],
};

export const C2_GEO_04_SEED: SkillSeed = {
  identity: C2_GEO_04_IDENTITY,
  dataset: C2_GEO_04_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C2-SHP-BSK-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-SPOT-0001",
      template: "GT-025",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-GEO-TAP-0299",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "town",
      rounds: 3,
      montessori_ref: "WB19-D1",
    },
    {
      code: "GL-C2-GEO-PAIR-0300",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB19-D4",
    },
    {
      code: "GL-C2-GEO-TAP-0301",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "home",
      rounds: 3,
      montessori_ref: "WB19-D1",
    },
  ],
};
