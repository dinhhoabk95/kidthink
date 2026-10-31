import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_SOL_02_IDENTITY: SkillIdentity = {
  code: "C2.SOL.02",
  strand_code: "C2.SOL",
  competency_code: "C2",
  name: "Lăn được – đứng yên",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "predict"],
  tier: "basic",
  prerequisites: ["C2.SOL.01"],
  learning_objectives: [
    {
      code: "LO-C2.SOL.02-01",
      behaviour: "Nhận biết và thực hành Lăn được – đứng yên ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.SOL.02-02",
      behaviour: "Vận dụng Lăn được – đứng yên trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.SOL.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Lăn được – đứng yên",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_SOL_02_DATASET: SkillDataset = {
  skill_code: "C2.SOL.02",
  concept_label: "Lăn được – đứng yên",
  surface: "game",
  items: [
    {
      id: "ball_roll",
      label: "quả bóng lăn",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "khối lăn được",
      },
      contrast_group: "rolling_solid",
    },
    {
      id: "marble_roll",
      label: "viên bi lăn",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🔮",
      },
      category: {
        type: "khối lăn được",
      },
      contrast_group: "rolling_solid",
    },
    {
      id: "can_roll",
      label: "lon nước lăn",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🥫",
      },
      category: {
        type: "khối lăn được",
      },
      contrast_group: "rolling_solid",
    },
    {
      id: "wheel_roll",
      label: "bánh xe lăn",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🛞",
      },
      category: {
        type: "khối lăn được",
      },
      contrast_group: "rolling_solid",
    },
    {
      id: "dice_stand",
      label: "xúc xắc đứng yên",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🎲",
      },
      category: {
        type: "khối đứng yên",
      },
      contrast_group: "standing_solid",
    },
    {
      id: "ice_stand",
      label: "khối đá đứng yên",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "khối đứng yên",
      },
      contrast_group: "standing_solid",
    },
    {
      id: "brick_stand",
      label: "viên gạch đứng yên",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "khối đứng yên",
      },
      contrast_group: "standing_solid",
    },
    {
      id: "box_stand",
      label: "thùng gỗ đứng yên",
      value: 8,
      image: {
        kind: "emoji",
        ref: "📦",
      },
      category: {
        type: "khối đứng yên",
      },
      contrast_group: "standing_solid",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "ball_roll",
      target_id: "dice_stand",
      metadata: {
        dimension: "motion_type",
      },
    },
    {
      type: "contrast",
      source_id: "can_roll",
      target_id: "brick_stand",
      metadata: {
        dimension: "motion_type",
      },
    },
    {
      type: "pair",
      source_id: "ball_roll",
      target_id: "marble_roll",
      metadata: {
        relation: "cùng lăn được",
      },
    },
    {
      type: "pair",
      source_id: "dice_stand",
      target_id: "ice_stand",
      metadata: {
        relation: "cùng đứng yên",
      },
    },
  ],
  axes: {
    motion_type: {
      values: ["khối lăn được", "khối đứng yên"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Lăn được – đứng yên",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Lăn được – đứng yên",
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
    narration_template: "Chúng mình cùng tìm hiểu về Lăn được – đứng yên nhé",
  },
  ordering: [
    "ball_roll",
    "marble_roll",
    "can_roll",
    "wheel_roll",
    "dice_stand",
    "ice_stand",
    "brick_stand",
    "box_stand",
  ],
};

export const C2_SOL_02_SEED: SkillSeed = {
  identity: C2_SOL_02_IDENTITY,
  dataset: C2_SOL_02_DATASET,
  levels: [
    {
      code: "GL-C2-SOL-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
