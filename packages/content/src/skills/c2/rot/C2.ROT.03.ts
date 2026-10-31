import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ROT_03_IDENTITY: SkillIdentity = {
  code: "C2.ROT.03",
  strand_code: "C2.ROT",
  competency_code: "C2",
  name: "Xoay hình nhiều bước",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["predict"],
  tier: "advanced",
  prerequisites: ["C2.ROT.02"],
  learning_objectives: [
    {
      code: "LO-C2.ROT.03-01",
      behaviour: "Nhận biết và thực hành Xoay 270° ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ROT.03-02",
      behaviour: "Vận dụng Xoay 270° trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ROT.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Xoay 270°",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ROT_03_DATASET: SkillDataset = {
  skill_code: "C2.ROT.03",
  concept_label: "Xoay hình nhiều bước",
  surface: "game",
  items: [
    {
      id: "pinwheel_rot",
      label: "kim la bàn xoay",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🧭",
      },
      category: {
        type: "kim xoay tròn",
      },
      contrast_group: "pointer_rot",
    },
    {
      id: "clock_rot",
      label: "kim đồng hồ xoay",
      value: 2,
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      category: {
        type: "kim xoay tròn",
      },
      contrast_group: "pointer_rot",
    },
    {
      id: "wheel_rot",
      label: "vòng đu quay xoay",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🎡",
      },
      category: {
        type: "kim xoay tròn",
      },
      contrast_group: "pointer_rot",
    },
    {
      id: "steering_rot",
      label: "bánh xe lăn tròn",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🛞",
      },
      category: {
        type: "kim xoay tròn",
      },
      contrast_group: "pointer_rot",
    },
    {
      id: "plane_tilt",
      label: "máy bay lượn vòng",
      value: 5,
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "phương tiện lượn",
      },
      contrast_group: "vehicle_rot",
    },
    {
      id: "rocket_tilt",
      label: "tên lửa nghiêng góc",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🚀",
      },
      category: {
        type: "phương tiện lượn",
      },
      contrast_group: "vehicle_rot",
    },
    {
      id: "boat_tilt",
      label: "thuyền buồm lướt sóng",
      value: 7,
      image: {
        kind: "emoji",
        ref: "⛵",
      },
      category: {
        type: "phương tiện lượn",
      },
      contrast_group: "vehicle_rot",
    },
    {
      id: "helicopter_tilt",
      label: "trực thăng liệng cánh",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🚁",
      },
      category: {
        type: "phương tiện lượn",
      },
      contrast_group: "vehicle_rot",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "pinwheel_rot",
      target_id: "plane_tilt",
      metadata: {
        dimension: "rotation_type",
      },
    },
    {
      type: "contrast",
      source_id: "clock_rot",
      target_id: "rocket_tilt",
      metadata: {
        dimension: "rotation_type",
      },
    },
    {
      type: "pair",
      source_id: "pinwheel_rot",
      target_id: "clock_rot",
      metadata: {
        relation: "cùng kim chỉ góc",
      },
    },
    {
      type: "pair",
      source_id: "plane_tilt",
      target_id: "rocket_tilt",
      metadata: {
        relation: "cùng góc bay lượn",
      },
    },
  ],
  axes: {
    rotation_type: {
      values: ["kim xoay tròn", "phương tiện lượn"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Xoay hình nhiều bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Xoay hình nhiều bước",
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
    narration_template: "Chúng mình cùng tìm hiểu về Xoay 270° nhé",
  },
  ordering: [
    "pinwheel_rot",
    "clock_rot",
    "wheel_rot",
    "steering_rot",
    "plane_tilt",
    "rocket_tilt",
    "boat_tilt",
    "helicopter_tilt",
  ],
};

export const C2_ROT_03_SEED: SkillSeed = {
  identity: C2_ROT_03_IDENTITY,
  dataset: C2_ROT_03_DATASET,
  levels: [
    {
      code: "GL-C2-ROT-DOTS-0005",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-MAZE-0005",
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-MAZE-0006",
      template: "GT-013",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
  ],
};
