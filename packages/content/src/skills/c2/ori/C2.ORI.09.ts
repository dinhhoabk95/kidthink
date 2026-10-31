import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_09_IDENTITY: SkillIdentity = {
  code: "C2.ORI.09",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Giữa",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "infer"],
  tier: "basic",
  prerequisites: ["C2.ORI.05", "C2.ORI.06"],
  learning_objectives: [
    {
      code: "LO-C2.ORI.09-01",
      behaviour: "Nhận biết và thực hành Giữa ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.09-02",
      behaviour: "Vận dụng Giữa trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Giữa",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_09_DATASET: SkillDataset = {
  skill_code: "C2.ORI.09",
  concept_label: "Giữa",
  surface: "game",
  items: [
    {
      id: "flower_middle",
      label: "bông hoa ở giữa",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "ở chính giữa",
      },
      contrast_group: "middle",
    },
    {
      id: "star_middle",
      label: "ngôi sao ở giữa",
      value: 2,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "ở chính giữa",
      },
      contrast_group: "middle",
    },
    {
      id: "ball_middle",
      label: "quả bóng ở giữa",
      value: 3,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "ở chính giữa",
      },
      contrast_group: "middle",
    },
    {
      id: "target_middle",
      label: "vạch kẻ ở giữa",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🎯",
      },
      category: {
        type: "ở chính giữa",
      },
      contrast_group: "middle",
    },
    {
      id: "leaf_left",
      label: "chiếc lá bên trái",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "ở hai bên",
      },
      contrast_group: "side",
    },
    {
      id: "leaf_right",
      label: "chiếc lá bên phải",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      category: {
        type: "ở hai bên",
      },
      contrast_group: "side",
    },
    {
      id: "flag_side",
      label: "cột cờ bên cạnh",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🚩",
      },
      category: {
        type: "ở hai bên",
      },
      contrast_group: "side",
    },
    {
      id: "barrier_side",
      label: "rào chắn hai bên",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🚧",
      },
      category: {
        type: "ở hai bên",
      },
      contrast_group: "side",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "flower_middle",
      target_id: "leaf_left",
      metadata: {
        dimension: "betweenness",
      },
    },
    {
      type: "contrast",
      source_id: "star_middle",
      target_id: "flag_side",
      metadata: {
        dimension: "betweenness",
      },
    },
    {
      type: "pair",
      source_id: "flower_middle",
      target_id: "star_middle",
      metadata: {
        relation: "cùng ở chính giữa",
      },
    },
    {
      type: "pair",
      source_id: "leaf_left",
      target_id: "leaf_right",
      metadata: {
        relation: "cùng ở hai bên",
      },
    },
  ],
  axes: {
    betweenness: {
      values: ["ở chính giữa", "ở hai bên"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Giữa",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Giữa",
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
    narration_template: "Chúng mình cùng tìm hiểu về Giữa nhé",
  },
  ordering: [
    "flower_middle",
    "star_middle",
    "ball_middle",
    "target_middle",
    "leaf_left",
    "leaf_right",
    "flag_side",
    "barrier_side",
  ],
};

export const C2_ORI_09_SEED: SkillSeed = {
  identity: C2_ORI_09_IDENTITY,
  dataset: C2_ORI_09_DATASET,
  levels: [
    {
      code: "GL-C2-ORI-TAP-0015",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TAP-0016",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
  ],
};
