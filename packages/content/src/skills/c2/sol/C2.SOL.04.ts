import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_SOL_04_IDENTITY: SkillIdentity = {
  code: "C2.SOL.04",
  strand_code: "C2.SOL",
  competency_code: "C2",
  name: "Khối lập phương",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "compare"],
  tier: "core",
  prerequisites: ["C2.GEO.02"],
  learning_objectives: [
    {
      code: "LO-C2.SOL.04-01",
      behaviour: "Nhận biết và thực hành Khối lập phương ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.SOL.04-02",
      behaviour: "Vận dụng Khối lập phương trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.SOL.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Khối lập phương",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_SOL_04_DATASET: SkillDataset = {
  skill_code: "C2.SOL.04",
  concept_label: "Khối lập phương",
  surface: "game",
  items: [
    {
      id: "dice_cube",
      label: "khối xúc xắc vuông",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🎲",
      },
      category: {
        type: "khối lập phương",
      },
      contrast_group: "cube",
    },
    {
      id: "ice_cube",
      label: "khối đá lạnh vuông",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "khối lập phương",
      },
      contrast_group: "cube",
    },
    {
      id: "gift_cube",
      label: "hộp quà lập phương",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "khối lập phương",
      },
      contrast_group: "cube",
    },
    {
      id: "box_cube",
      label: "thùng gỗ vuông vắn",
      value: 4,
      image: {
        kind: "emoji",
        ref: "📦",
      },
      category: {
        type: "khối lập phương",
      },
      contrast_group: "cube",
    },
    {
      id: "ball_round",
      label: "quả bóng tròn lăn",
      value: 5,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "khối tròn lăn",
      },
      contrast_group: "round_solid",
    },
    {
      id: "orange_round",
      label: "trái cam tròn lăn",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "khối tròn lăn",
      },
      contrast_group: "round_solid",
    },
    {
      id: "can_round",
      label: "lon nước lăn tròn",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🥫",
      },
      category: {
        type: "khối tròn lăn",
      },
      contrast_group: "round_solid",
    },
    {
      id: "globe_round",
      label: "quả địa cầu lăn",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🌍",
      },
      category: {
        type: "khối tròn lăn",
      },
      contrast_group: "round_solid",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "dice_cube",
      target_id: "ball_round",
      metadata: {
        dimension: "solid_type",
      },
    },
    {
      type: "contrast",
      source_id: "ice_cube",
      target_id: "orange_round",
      metadata: {
        dimension: "solid_type",
      },
    },
    {
      type: "pair",
      source_id: "dice_cube",
      target_id: "ice_cube",
      metadata: {
        relation: "cùng khối lập phương",
      },
    },
    {
      type: "pair",
      source_id: "ball_round",
      target_id: "orange_round",
      metadata: {
        relation: "cùng khối tròn lăn",
      },
    },
  ],
  axes: {
    solid_type: {
      values: ["khối lập phương", "khối tròn lăn"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Khối lập phương",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Khối lập phương",
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
    narration_template: "Chúng mình cùng tìm hiểu về Khối lập phương nhé",
  },
  ordering: [
    "dice_cube",
    "ice_cube",
    "gift_cube",
    "box_cube",
    "ball_round",
    "orange_round",
    "can_round",
    "globe_round",
  ],
};

export const C2_SOL_04_SEED: SkillSeed = {
  identity: C2_SOL_04_IDENTITY,
  dataset: C2_SOL_04_DATASET,
  levels: [
    {
      code: "GL-C2-SOL-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
