import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ROT_01_IDENTITY: SkillIdentity = {
  code: "C2.ROT.01",
  strand_code: "C2.ROT",
  competency_code: "C2",
  name: "Xoay hình một góc",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["predict"],
  tier: "core",
  prerequisites: ["C2.GEO.02"],
  learning_objectives: [
    {
      code: "LO-C2.ROT.01-01",
      behaviour: "Nhận biết và thực hành Xoay 90° ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ROT.01-02",
      behaviour: "Vận dụng Xoay 90° trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ROT.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Xoay 90°",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ROT_01_DATASET: SkillDataset = {
  skill_code: "C2.ROT.01",
  concept_label: "Xoay hình một góc",
  surface: "game",
  items: [
    {
      id: "arrow_north",
      label: "mũi tên chỉ lên",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⬆️",
      },
      category: {
        type: "mũi tên hướng",
      },
      contrast_group: "arrow_rot",
    },
    {
      id: "arrow_east",
      label: "mũi tên chỉ phải",
      value: 2,
      image: {
        kind: "emoji",
        ref: "➡️",
      },
      category: {
        type: "mũi tên hướng",
      },
      contrast_group: "arrow_rot",
    },
    {
      id: "arrow_south",
      label: "mũi tên chỉ xuống",
      value: 3,
      image: {
        kind: "emoji",
        ref: "⬇️",
      },
      category: {
        type: "mũi tên hướng",
      },
      contrast_group: "arrow_rot",
    },
    {
      id: "arrow_west",
      label: "mũi tên chỉ trái",
      value: 4,
      image: {
        kind: "emoji",
        ref: "⬅️",
      },
      category: {
        type: "mũi tên hướng",
      },
      contrast_group: "arrow_rot",
    },
    {
      id: "triangle_piece",
      label: "tam giác xoay",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "đồ vật xoay",
      },
      contrast_group: "object_rot",
    },
    {
      id: "key_rotate",
      label: "chiếc chìa khóa",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🔑",
      },
      category: {
        type: "đồ vật xoay",
      },
      contrast_group: "object_rot",
    },
    {
      id: "flag_triangle",
      label: "lá cờ xoay",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🚩",
      },
      category: {
        type: "đồ vật xoay",
      },
      contrast_group: "object_rot",
    },
    {
      id: "hammer_wood",
      label: "cây búa xoay",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🔨",
      },
      category: {
        type: "đồ vật xoay",
      },
      contrast_group: "object_rot",
    },
    {
      id: "spoke_pentagon_dial",
      label: "đĩa nan hoa ngũ giác",
      value: 9,
      image: {
        kind: "emoji",
        ref: "☸️",
      },
      category: {
        type: "đồ vật xoay",
      },
      contrast_group: "object_rot",
    },
    {
      id: "gear_rot_clockwise",
      label: "bánh răng xoay thuận",
      value: 10,
      image: {
        kind: "emoji",
        ref: "⚙️",
      },
      category: {
        type: "đồ vật xoay",
      },
      contrast_group: "object_rot",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "arrow_north",
      target_id: "triangle_piece",
      metadata: {
        dimension: "rotation_type",
      },
    },
    {
      type: "contrast",
      source_id: "arrow_east",
      target_id: "key_rotate",
      metadata: {
        dimension: "rotation_type",
      },
    },
    {
      type: "pair",
      source_id: "arrow_north",
      target_id: "arrow_south",
      metadata: {
        relation: "cùng mũi tên hướng",
      },
    },
    {
      type: "pair",
      source_id: "triangle_piece",
      target_id: "flag_triangle",
      metadata: {
        relation: "cùng đồ vật xoay",
      },
    },
    {
      type: "pair",
      source_id: "spoke_pentagon_dial",
      target_id: "gear_rot_clockwise",
      metadata: {
        relation: "cùng bánh xoay tròn",
      },
    },
  ],
  axes: {
    rotation_type: {
      values: ["mũi tên hướng", "đồ vật xoay"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Xoay hình một góc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Xoay hình một góc",
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
    narration_template: "Chúng mình cùng tìm hiểu về Xoay 90° nhé",
  },
  ordering: [
    "arrow_north",
    "arrow_east",
    "arrow_south",
    "arrow_west",
    "triangle_piece",
    "key_rotate",
    "flag_triangle",
    "hammer_wood",
    "spoke_pentagon_dial",
    "gear_rot_clockwise",
  ],
};

export const C2_ROT_01_SEED: SkillSeed = {
  identity: C2_ROT_01_IDENTITY,
  dataset: C2_ROT_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C2-PRJ-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-DOTS-0001",
      template: "GT-011",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-DIFF-0001",
      template: "GT-014",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-ISO-0001",
      template: "GT-017",
      band: "5-6",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
    {
      code: "GL-C2-ROT-TAP-0282",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB21-D1",
    },
    {
      code: "GL-C2-ROT-TAP-0283",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "art",
      rounds: 3,
      montessori_ref: "WB21-D2",
    },
    {
      code: "GL-C2-ROT-MATRX-0284",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB21-D2",
    },
  ],
};
