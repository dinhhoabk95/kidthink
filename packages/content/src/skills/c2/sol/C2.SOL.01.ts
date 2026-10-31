import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_SOL_01_IDENTITY: SkillIdentity = {
  code: "C2.SOL.01",
  strand_code: "C2.SOL",
  competency_code: "C2",
  name: "Khối cầu",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: ["C2.GEO.01"],
  learning_objectives: [
    {
      code: "LO-C2.SOL.01-01",
      behaviour: "Nhận biết và thực hành Khối cầu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.SOL.01-02",
      behaviour: "Vận dụng Khối cầu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.SOL.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Khối cầu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_SOL_01_DATASET: SkillDataset = {
  skill_code: "C2.SOL.01",
  concept_label: "Khối cầu",
  surface: "game",
  items: [
    {
      id: "ball_sphere",
      label: "quả bóng tròn",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "khối cầu",
      },
      contrast_group: "sphere",
    },
    {
      id: "basket_sphere",
      label: "bóng rổ tròn",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🏀",
      },
      category: {
        type: "khối cầu",
      },
      contrast_group: "sphere",
    },
    {
      id: "globe_sphere",
      label: "quả địa cầu",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🌍",
      },
      category: {
        type: "khối cầu",
      },
      contrast_group: "sphere",
    },
    {
      id: "orange_sphere",
      label: "trái cam tròn",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "khối cầu",
      },
      contrast_group: "sphere",
    },
    {
      id: "dice_cube",
      label: "khối xúc xắc",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🎲",
      },
      category: {
        type: "khối có góc",
      },
      contrast_group: "angular_solid",
    },
    {
      id: "ice_cube",
      label: "khối đá lạnh",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "khối có góc",
      },
      contrast_group: "angular_solid",
    },
    {
      id: "gift_box",
      label: "hộp quà vuông",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "khối có góc",
      },
      contrast_group: "angular_solid",
    },
    {
      id: "wooden_box",
      label: "thùng các-tông",
      value: 8,
      image: {
        kind: "emoji",
        ref: "📦",
      },
      category: {
        type: "khối có góc",
      },
      contrast_group: "angular_solid",
    },
    {
      id: "sphere_crystal",
      label: "quả cầu pha lê",
      value: 9,
      image: {
        kind: "emoji",
        ref: "🔮",
      },
      category: {
        type: "khối cầu",
      },
      contrast_group: "sphere",
    },
    {
      id: "cylinder_wood",
      label: "khối gỗ hình trụ",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "khối trụ",
      },
      contrast_group: "other_solid",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "ball_sphere",
      target_id: "dice_cube",
      metadata: {
        dimension: "solid_type",
      },
    },
    {
      type: "contrast",
      source_id: "orange_sphere",
      target_id: "wooden_box",
      metadata: {
        dimension: "solid_type",
      },
    },
    {
      type: "pair",
      source_id: "ball_sphere",
      target_id: "basket_sphere",
      metadata: {
        relation: "cùng khối cầu",
      },
    },
    {
      type: "pair",
      source_id: "dice_cube",
      target_id: "ice_cube",
      metadata: {
        relation: "cùng khối có góc",
      },
    },
  ],
  axes: {
    solid_type: {
      values: ["khối cầu", "khối có góc"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Khối cầu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Khối cầu",
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
    prompt_template: "Bé hãy chọn khối cầu {label} nhé!",
    narration_template:
      "Khối cầu tròn xoe, có thể lăn về mọi phía! Chúng mình cùng tìm khối cầu nhé",
  },
  ordering: [
    "ball_sphere",
    "basket_sphere",
    "globe_sphere",
    "orange_sphere",
    "sphere_crystal",
    "dice_cube",
    "ice_cube",
    "gift_box",
    "wooden_box",
    "cylinder_wood",
  ],
};

export const C2_SOL_01_SEED: SkillSeed = {
  identity: C2_SOL_01_IDENTITY,
  dataset: C2_SOL_01_DATASET,
  levels: [
    {
      code: "GL-C2-SOL-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TAP-0101",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB00-D4",
    },
  ],
};
