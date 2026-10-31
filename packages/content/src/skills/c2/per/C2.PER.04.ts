import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_PER_04_IDENTITY: SkillIdentity = {
  code: "C2.PER.04",
  strand_code: "C2.PER",
  competency_code: "C2",
  name: "Nhìn từ bên cạnh",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "predict"],
  tier: "advanced",
  prerequisites: ["C2.PER.01"],
  learning_objectives: [
    {
      code: "LO-C2.PER.04-01",
      behaviour: "Nhận biết và thực hành Nhìn từ bên cạnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.PER.04-02",
      behaviour: "Vận dụng Nhìn từ bên cạnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.PER.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhìn từ bên cạnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_PER_04_DATASET: SkillDataset = {
  skill_code: "C2.PER.04",
  concept_label: "Nhìn từ bên cạnh",
  surface: "game",
  items: [
    {
      id: "shoe_side",
      label: "chiếc giày nhìn nghiêng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "👟",
      },
      category: {
        type: "nhìn bên cạnh",
      },
      contrast_group: "side_view",
    },
    {
      id: "car_side",
      label: "ô tô nhìn bên cạnh",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "nhìn bên cạnh",
      },
      contrast_group: "side_view",
    },
    {
      id: "train_side",
      label: "đoàn tàu nhìn bên cạnh",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "nhìn bên cạnh",
      },
      contrast_group: "side_view",
    },
    {
      id: "bike_side",
      label: "xe đạp nhìn bên cạnh",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "nhìn bên cạnh",
      },
      contrast_group: "side_view",
    },
    {
      id: "umbrella_top",
      label: "cây dù nhìn từ trên",
      value: 5,
      image: {
        kind: "emoji",
        ref: "☂️",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "pizza_top",
      label: "miếng bánh nhìn từ trên",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🍕",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "target_top",
      label: "tâm bia nhìn thẳng",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🎯",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "compass_top",
      label: "la bàn nhìn từ trên",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🧭",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "shoe_side",
      target_id: "umbrella_top",
      metadata: {
        dimension: "perspective",
      },
    },
    {
      type: "contrast",
      source_id: "car_side",
      target_id: "pizza_top",
      metadata: {
        dimension: "perspective",
      },
    },
    {
      type: "pair",
      source_id: "shoe_side",
      target_id: "car_side",
      metadata: {
        relation: "cùng nhìn cạnh",
      },
    },
    {
      type: "pair",
      source_id: "umbrella_top",
      target_id: "pizza_top",
      metadata: {
        relation: "cùng nhìn khác",
      },
    },
  ],
  axes: {
    perspective: {
      values: ["nhìn bên cạnh", "góc nhìn khác"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhìn từ bên cạnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhìn từ bên cạnh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhìn từ bên cạnh nhé",
  },
  ordering: [
    "shoe_side",
    "car_side",
    "train_side",
    "bike_side",
    "umbrella_top",
    "pizza_top",
    "target_top",
    "compass_top",
  ],
};

export const C2_PER_04_SEED: SkillSeed = {
  identity: C2_PER_04_IDENTITY,
  dataset: C2_PER_04_DATASET,
  levels: [
    {
      code: "GL-C2-PER-PAIR-0007",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-PAIR-0008",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
  ],
};
