import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_SOL_07_IDENTITY: SkillIdentity = {
  code: "C2.SOL.07",
  strand_code: "C2.SOL",
  competency_code: "C2",
  name: "Mặt · cạnh · đỉnh của khối",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["count", "observe"],
  tier: "advanced",
  prerequisites: ["C2.SOL.04", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C2.SOL.07-01",
      behaviour:
        "Nhận biết và thực hành Mặt · cạnh · đỉnh của khối ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.SOL.07-02",
      behaviour:
        "Vận dụng Mặt · cạnh · đỉnh của khối trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.SOL.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Mặt · cạnh · đỉnh của khối",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_SOL_07_DATASET: SkillDataset = {
  skill_code: "C2.SOL.07",
  concept_label: "Mặt · cạnh · đỉnh của khối",
  surface: "game",
  items: [
    {
      id: "dice_flat",
      label: "xúc xắc mặt phẳng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🎲",
      },
      category: {
        type: "khối mặt phẳng",
      },
      contrast_group: "flat_face",
    },
    {
      id: "ice_flat",
      label: "khối đá mặt phẳng",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "khối mặt phẳng",
      },
      contrast_group: "flat_face",
    },
    {
      id: "gift_flat",
      label: "hộp quà mặt phẳng",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "khối mặt phẳng",
      },
      contrast_group: "flat_face",
    },
    {
      id: "brick_flat",
      label: "viên gạch mặt phẳng",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "khối mặt phẳng",
      },
      contrast_group: "flat_face",
    },
    {
      id: "ball_curved",
      label: "quả bóng mặt cong",
      value: 5,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "khối mặt cong",
      },
      contrast_group: "curved_face",
    },
    {
      id: "basket_curved",
      label: "bóng rổ mặt cong",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🏀",
      },
      category: {
        type: "khối mặt cong",
      },
      contrast_group: "curved_face",
    },
    {
      id: "globe_curved",
      label: "quả địa cầu mặt cong",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🌍",
      },
      category: {
        type: "khối mặt cong",
      },
      contrast_group: "curved_face",
    },
    {
      id: "marble_curved",
      label: "viên bi mặt cong",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🔮",
      },
      category: {
        type: "khối mặt cong",
      },
      contrast_group: "curved_face",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "dice_flat",
      target_id: "ball_curved",
      metadata: {
        dimension: "face_type",
      },
    },
    {
      type: "contrast",
      source_id: "ice_flat",
      target_id: "basket_curved",
      metadata: {
        dimension: "face_type",
      },
    },
    {
      type: "pair",
      source_id: "dice_flat",
      target_id: "ice_flat",
      metadata: {
        relation: "cùng mặt phẳng",
      },
    },
    {
      type: "pair",
      source_id: "ball_curved",
      target_id: "basket_curved",
      metadata: {
        relation: "cùng mặt cong",
      },
    },
  ],
  axes: {
    face_type: {
      values: ["khối mặt phẳng", "khối mặt cong"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Mặt · cạnh · đỉnh của khối",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Mặt · cạnh · đỉnh của khối",
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
    narration_template:
      "Chúng mình cùng tìm hiểu về Mặt · cạnh · đỉnh của khối nhé",
  },
  ordering: [
    "dice_flat",
    "ice_flat",
    "gift_flat",
    "brick_flat",
    "ball_curved",
    "basket_curved",
    "globe_curved",
    "marble_curved",
  ],
};

export const C2_SOL_07_SEED: SkillSeed = {
  identity: C2_SOL_07_IDENTITY,
  dataset: C2_SOL_07_DATASET,
  levels: [
    {
      code: "GL-C2-SOL-TAP-0013",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCMP-0013",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-SOL-TCMP-0014",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
  ],
};
