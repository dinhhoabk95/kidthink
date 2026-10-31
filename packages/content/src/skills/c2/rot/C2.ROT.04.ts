import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ROT_04_IDENTITY: SkillIdentity = {
  code: "C2.ROT.04",
  strand_code: "C2.ROT",
  competency_code: "C2",
  name: "Nhận ra hình đã xoay",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["compare", "infer"],
  tier: "advanced",
  prerequisites: ["C2.ROT.01"],
  learning_objectives: [
    {
      code: "LO-C2.ROT.04-01",
      behaviour:
        "Nhận biết và thực hành Nhận ra hình giống nhau sau khi xoay ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ROT.04-02",
      behaviour:
        "Vận dụng Nhận ra hình giống nhau sau khi xoay trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ROT.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhận ra hình giống nhau sau khi xoay",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ROT_04_DATASET: SkillDataset = {
  skill_code: "C2.ROT.04",
  concept_label: "Nhận ra hình đã xoay",
  surface: "game",
  items: [
    {
      id: "heart_orig",
      label: "trái tim ban đầu",
      value: 1,
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      category: {
        type: "hình ban đầu",
      },
      contrast_group: "same_shape",
    },
    {
      id: "star_orig",
      label: "ngôi sao ban đầu",
      value: 2,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "hình ban đầu",
      },
      contrast_group: "same_shape",
    },
    {
      id: "diamond_orig",
      label: "viên kim cương",
      value: 3,
      image: {
        kind: "emoji",
        ref: "💎",
      },
      category: {
        type: "hình ban đầu",
      },
      contrast_group: "same_shape",
    },
    {
      id: "square_orig",
      label: "khối vuông ban đầu",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🟨",
      },
      category: {
        type: "hình ban đầu",
      },
      contrast_group: "same_shape",
    },
    {
      id: "heart_tilt",
      label: "trái tim đổi hướng",
      value: 5,
      image: {
        kind: "emoji",
        ref: "💖",
      },
      category: {
        type: "hình đổi hướng",
      },
      contrast_group: "rotated_shape",
    },
    {
      id: "star_tilt",
      label: "ngôi sao đổi hướng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🌟",
      },
      category: {
        type: "hình đổi hướng",
      },
      contrast_group: "rotated_shape",
    },
    {
      id: "gem_tilt",
      label: "hoa đá đổi hướng",
      value: 7,
      image: {
        kind: "emoji",
        ref: "💠",
      },
      category: {
        type: "hình đổi hướng",
      },
      contrast_group: "rotated_shape",
    },
    {
      id: "circle_tilt",
      label: "hình tròn xoay đều",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🟡",
      },
      category: {
        type: "hình đổi hướng",
      },
      contrast_group: "rotated_shape",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "heart_orig",
      target_id: "heart_tilt",
      metadata: {
        dimension: "rotation_state",
      },
    },
    {
      type: "contrast",
      source_id: "star_orig",
      target_id: "star_tilt",
      metadata: {
        dimension: "rotation_state",
      },
    },
    {
      type: "pair",
      source_id: "heart_orig",
      target_id: "star_orig",
      metadata: {
        relation: "cùng hình ban đầu",
      },
    },
    {
      type: "pair",
      source_id: "heart_tilt",
      target_id: "star_tilt",
      metadata: {
        relation: "cùng hình đã xoay",
      },
    },
  ],
  axes: {
    rotation_type: {
      values: ["hình ban đầu", "hình đổi hướng"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhận ra hình đã xoay",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận ra hình đã xoay",
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
      "Chúng mình cùng tìm hiểu về Nhận ra hình giống nhau sau khi xoay nhé",
  },
  ordering: [
    "heart_orig",
    "star_orig",
    "diamond_orig",
    "square_orig",
    "heart_tilt",
    "star_tilt",
    "gem_tilt",
    "circle_tilt",
  ],
};

export const C2_ROT_04_SEED: SkillSeed = {
  identity: C2_ROT_04_IDENTITY,
  dataset: C2_ROT_04_DATASET,
  levels: [
    {
      code: "GL-C2-ROT-SHP-0006",
      template: "GT-019",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-SHP-0008",
      template: "GT-019",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
    },
  ],
};
