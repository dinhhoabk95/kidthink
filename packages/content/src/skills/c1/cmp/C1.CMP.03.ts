import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_03_IDENTITY: SkillIdentity = {
  code: "C1.CMP.03",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Bằng nhau",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.01", "C1.CMP.02"],
  learning_objectives: [
    {
      code: "LO-C1.CMP.03-01",
      behaviour: "Nhận biết và thực hành Bằng nhau ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.03-02",
      behaviour: "Vận dụng Bằng nhau trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Bằng nhau",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_03_DATASET: SkillDataset = {
  skill_code: "C1.CMP.03",
  concept_label: "Bằng nhau",
  surface: "game",
  items: [
    {
      id: "pair_apple_1",
      label: "một quả táo",
      glyph: "🍎",
      value: 1,
      contrast_group: "quantity",
      ordering: 1,
      category: {
        type: "nhóm bằng nhau",
      },
      image: {
        kind: "emoji",
        ref: "🍎",
      },
    },
    {
      id: "pair_orange_1",
      label: "một quả cam",
      glyph: "🍊",
      value: 1,
      contrast_group: "quantity",
      ordering: 2,
      category: {
        type: "nhóm bằng nhau",
      },
      image: {
        kind: "emoji",
        ref: "🍊",
      },
    },
    {
      id: "pair_bear_2",
      label: "hai chú gấu",
      glyph: "🐻🐻",
      value: 2,
      contrast_group: "quantity",
      ordering: 3,
      category: {
        type: "nhóm bằng nhau",
      },
      image: {
        kind: "emoji",
        ref: "🐻",
      },
    },
    {
      id: "pair_rabbit_2",
      label: "hai chú thỏ",
      glyph: "🐰🐰",
      value: 2,
      contrast_group: "quantity",
      ordering: 4,
      category: {
        type: "nhóm bằng nhau",
      },
      image: {
        kind: "emoji",
        ref: "🐰",
      },
    },
    {
      id: "pair_car_3",
      label: "ba chiếc ô tô",
      glyph: "🚗🚗🚗",
      value: 3,
      contrast_group: "quantity",
      ordering: 5,
      category: {
        type: "nhóm bằng nhau",
      },
      image: {
        kind: "emoji",
        ref: "🚗",
      },
    },
    {
      id: "pair_ball_3",
      label: "ba quả bóng",
      glyph: "⚽⚽⚽",
      value: 3,
      contrast_group: "quantity",
      ordering: 6,
      category: {
        type: "nhóm bằng nhau",
      },
      image: {
        kind: "emoji",
        ref: "⚽",
      },
    },
    {
      id: "pair_star_4",
      label: "bốn ngôi sao",
      glyph: "⭐⭐⭐⭐",
      value: 4,
      contrast_group: "quantity",
      ordering: 7,
      category: {
        type: "nhóm bằng nhau",
      },
      image: {
        kind: "emoji",
        ref: "⭐",
      },
    },
    {
      id: "pair_flower_4",
      label: "bốn bông hoa",
      glyph: "🌸🌸🌸🌸",
      value: 4,
      contrast_group: "quantity",
      ordering: 8,
      category: {
        type: "nhóm bằng nhau",
      },
      image: {
        kind: "emoji",
        ref: "🌸",
      },
    },
    // --- Ngữ liệu WB06: Vật thể bằng nhau & Đĩa cân ---
    {
      id: "wb06_carrots_equal_3",
      label: "ba củ cà rốt cam",
      glyph: "🥕🥕🥕",
      value: 3,
      contrast_group: "equal_groups",
      ordering: 9,
      image: { kind: "emoji", ref: "🥕" },
      category: { type: "nhóm cân bằng" },
    },
    {
      id: "wb06_butterflies_equal_4",
      label: "bốn chú bướm hồng",
      glyph: "🦋🦋🦋🦋",
      value: 4,
      contrast_group: "equal_groups",
      ordering: 10,
      image: { kind: "emoji", ref: "🦋" },
      category: { type: "nhóm cân bằng" },
    },
    {
      id: "wb06_flowers_equal_4",
      label: "bốn bông hoa đỏ",
      glyph: "🌸🌸🌸🌸",
      value: 4,
      contrast_group: "equal_groups",
      ordering: 11,
      image: { kind: "emoji", ref: "🌸" },
      category: { type: "nhóm cân bằng" },
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "pair_apple_1",
      target_id: "pair_orange_1",
    },
    {
      type: "pair",
      source_id: "pair_bear_2",
      target_id: "pair_rabbit_2",
    },
    {
      type: "pair",
      source_id: "pair_car_3",
      target_id: "pair_ball_3",
    },
    {
      type: "pair",
      source_id: "pair_star_4",
      target_id: "pair_flower_4",
    },
    {
      type: "pair",
      source_id: "wb06_carrots_equal_3",
      target_id: "wb06_carrots_equal_3",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với số lượng bằng nhau",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng nhóm bằng nhau",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt nhóm bằng nhau với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng nhận biết nhóm bằng nhau",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục nhận biết bằng nhau và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm các nhóm bằng nhau nhé",
  },
  ordering: [
    "pair_apple_1",
    "pair_orange_1",
    "pair_bear_2",
    "pair_rabbit_2",
    "pair_car_3",
    "pair_ball_3",
    "pair_star_4",
    "pair_flower_4",
    "wb06_carrots_equal_3",
    "wb06_butterflies_equal_4",
    "wb06_flowers_equal_4",
  ],
};

export const C1_CMP_03_SEED: SkillSeed = {
  identity: C1_CMP_03_IDENTITY,
  dataset: C1_CMP_03_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-CONT-0118",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB06-D2",
    },
    {
      code: "GL-C1-CMP-TAP-0011",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0013",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    // --- Bổ sung Montessori WB06 ---
    {
      code: "GL-C1-CMP-SLOT-0146",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB06-D2",
    },
    {
      code: "GL-C1-CMP-BAL-0147",
      template: "GT-014",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB06-D3",
    },
  ],
};
