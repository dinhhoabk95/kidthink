import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_SOL_03_IDENTITY: SkillIdentity = {
  code: "C2.SOL.03",
  strand_code: "C2.SOL",
  competency_code: "C2",
  name: "Khối trụ",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "compare"],
  tier: "core",
  prerequisites: ["C2.SOL.01"],
  learning_objectives: [
    {
      code: "LO-C2.SOL.03-01",
      behaviour: "Nhận biết và thực hành Khối trụ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.SOL.03-02",
      behaviour: "Vận dụng Khối trụ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.SOL.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Khối trụ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_SOL_03_DATASET: SkillDataset = {
  skill_code: "C2.SOL.03",
  concept_label: "Khối trụ",
  surface: "game",
  items: [
    {
      id: "can_cylinder",
      label: "lon nước khối trụ",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🥫",
      },
      category: {
        type: "khối trụ",
      },
      contrast_group: "cylinder",
    },
    {
      id: "drum_cylinder",
      label: "cái trống khối trụ",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "khối trụ",
      },
      contrast_group: "cylinder",
    },
    {
      id: "candle_cylinder",
      label: "ngọn nến khối trụ",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🕯️",
      },
      category: {
        type: "khối trụ",
      },
      contrast_group: "cylinder",
    },
    {
      id: "log_cylinder",
      label: "khúc gỗ khối trụ",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "khối trụ",
      },
      contrast_group: "cylinder",
    },
    {
      id: "ball_other",
      label: "quả bóng khối cầu",
      value: 5,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "khối khác",
      },
      contrast_group: "other_solid",
    },
    {
      id: "dice_other",
      label: "xúc xắc lập phương",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🎲",
      },
      category: {
        type: "khối khác",
      },
      contrast_group: "other_solid",
    },
    {
      id: "gift_other",
      label: "hộp quà vuông",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "khối khác",
      },
      contrast_group: "other_solid",
    },
    {
      id: "cone_other",
      label: "kem ốc quế",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🍦",
      },
      category: {
        type: "khối khác",
      },
      contrast_group: "other_solid",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "can_cylinder",
      target_id: "ball_other",
      metadata: {
        dimension: "solid_type",
      },
    },
    {
      type: "contrast",
      source_id: "drum_cylinder",
      target_id: "dice_other",
      metadata: {
        dimension: "solid_type",
      },
    },
    {
      type: "pair",
      source_id: "can_cylinder",
      target_id: "drum_cylinder",
      metadata: {
        relation: "cùng khối trụ",
      },
    },
    {
      type: "pair",
      source_id: "ball_other",
      target_id: "dice_other",
      metadata: {
        relation: "cùng khối khác",
      },
    },
  ],
  axes: {
    solid_type: {
      values: ["khối trụ", "khối khác"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Khối trụ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Khối trụ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Khối trụ nhé",
  },
  ordering: [
    "can_cylinder",
    "drum_cylinder",
    "candle_cylinder",
    "log_cylinder",
    "ball_other",
    "dice_other",
    "gift_other",
    "cone_other",
  ],
};

export const C2_SOL_03_SEED: SkillSeed = {
  identity: C2_SOL_03_IDENTITY,
  dataset: C2_SOL_03_DATASET,
  levels: [
    {
      code: "GL-C2-SOL-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
