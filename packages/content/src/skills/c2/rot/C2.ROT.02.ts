import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ROT_02_IDENTITY: SkillIdentity = {
  code: "C2.ROT.02",
  strand_code: "C2.ROT",
  competency_code: "C2",
  name: "Xoay ngược hình lại",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["predict"],
  tier: "advanced",
  prerequisites: ["C2.ROT.01"],
  learning_objectives: [
    {
      code: "LO-C2.ROT.02-01",
      behaviour: "Nhận biết và thực hành Xoay 180° ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ROT.02-02",
      behaviour: "Vận dụng Xoay 180° trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ROT.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Xoay 180°",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ROT_02_DATASET: SkillDataset = {
  skill_code: "C2.ROT.02",
  concept_label: "Xoay ngược hình lại",
  surface: "game",
  items: [
    {
      id: "tree_up",
      label: "cây thông đứng thẳng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌲",
      },
      category: {
        type: "hình đứng thẳng",
      },
      contrast_group: "upright",
    },
    {
      id: "bottle_up",
      label: "chai nước đứng thẳng",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍾",
      },
      category: {
        type: "hình đứng thẳng",
      },
      contrast_group: "upright",
    },
    {
      id: "glass_up",
      label: "cốc sữa đứng thẳng",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "hình đứng thẳng",
      },
      contrast_group: "upright",
    },
    {
      id: "candle_up",
      label: "ngọn nến đứng thẳng",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🕯️",
      },
      category: {
        type: "hình đứng thẳng",
      },
      contrast_group: "upright",
    },
    {
      id: "umbrella_down",
      label: "cây dù chúc xuống",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🌂",
      },
      category: {
        type: "hình xoay ngược",
      },
      contrast_group: "inverted",
    },
    {
      id: "mushroom_down",
      label: "nấm nghiêng đầu",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍄",
      },
      category: {
        type: "hình xoay ngược",
      },
      contrast_group: "inverted",
    },
    {
      id: "bell_tilt",
      label: "chuông lắc nghiêng",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🔔",
      },
      category: {
        type: "hình xoay ngược",
      },
      contrast_group: "inverted",
    },
    {
      id: "trophy_tilt",
      label: "chiếc cúp lật úp",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🏆",
      },
      category: {
        type: "hình xoay ngược",
      },
      contrast_group: "inverted",
    },
    {
      id: "mirror_axis_vertical",
      label: "trục gương nét đứt",
      value: 9,
      image: {
        kind: "emoji",
        ref: "🪞",
      },
      category: {
        type: "đối xứng gương",
      },
      contrast_group: "mirror",
    },
    {
      id: "color_bead_table_5x6",
      label: "bảng hạt đối xứng",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "đối xứng gương",
      },
      contrast_group: "mirror",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "tree_up",
      target_id: "umbrella_down",
      metadata: {
        dimension: "orientation",
      },
    },
    {
      type: "contrast",
      source_id: "bottle_up",
      target_id: "mushroom_down",
      metadata: {
        dimension: "orientation",
      },
    },
    {
      type: "pair",
      source_id: "tree_up",
      target_id: "candle_up",
      metadata: {
        relation: "cùng đứng thẳng",
      },
    },
    {
      type: "pair",
      source_id: "umbrella_down",
      target_id: "trophy_tilt",
      metadata: {
        relation: "cùng xoay ngược",
      },
    },
    {
      type: "pair",
      source_id: "mirror_axis_vertical",
      target_id: "color_bead_table_5x6",
      metadata: {
        relation: "cùng phản chiếu qua gương",
      },
    },
  ],
  axes: {
    rotation_type: {
      values: ["hình đứng thẳng", "hình xoay ngược"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Xoay ngược hình lại",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Xoay ngược hình lại",
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
    narration_template: "Chúng mình cùng tìm hiểu về Xoay 180° nhé",
  },
  ordering: [
    "tree_up",
    "bottle_up",
    "glass_up",
    "candle_up",
    "umbrella_down",
    "mushroom_down",
    "bell_tilt",
    "trophy_tilt",
    "mirror_axis_vertical",
    "color_bead_table_5x6",
  ],
};

export const C2_ROT_02_SEED: SkillSeed = {
  identity: C2_ROT_02_IDENTITY,
  dataset: C2_ROT_02_DATASET,
  levels: [
    {
      code: "GL-C2-PRJ-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-PRJ-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-ISO-0003",
      template: "GT-017",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-MATRX-0285",
      template: "GT-011",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "home",
      rounds: 3,
      montessori_ref: "WB21-D3",
    },
    {
      code: "GL-C2-ROT-TAP-0286",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "festival",
      rounds: 3,
      montessori_ref: "WB21-D2",
    },
  ],
};
