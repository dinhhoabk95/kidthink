import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_PER_02_IDENTITY: SkillIdentity = {
  code: "C2.PER.02",
  strand_code: "C2.PER",
  competency_code: "C2",
  name: "Nhìn từ phía sau",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "predict"],
  tier: "advanced",
  prerequisites: ["C2.PER.01"],
  learning_objectives: [
    {
      code: "LO-C2.PER.02-01",
      behaviour: "Nhận biết và thực hành Nhìn từ phía sau ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.PER.02-02",
      behaviour: "Vận dụng Nhìn từ phía sau trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.PER.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhìn từ phía sau",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_PER_02_DATASET: SkillDataset = {
  skill_code: "C2.PER.02",
  concept_label: "Nhìn từ phía sau",
  surface: "game",
  items: [
    {
      id: "backpack_back",
      label: "chiếc ba lô phía sau",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "nhìn phía sau",
      },
      contrast_group: "back_view",
    },
    {
      id: "turtle_back",
      label: "mai rùa nhìn từ sau",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      category: {
        type: "nhìn phía sau",
      },
      contrast_group: "back_view",
    },
    {
      id: "ladybug_back",
      label: "bọ rùa nhìn từ sau",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🐞",
      },
      category: {
        type: "nhìn phía sau",
      },
      contrast_group: "back_view",
    },
    {
      id: "chair_back",
      label: "lưng ghế phía sau",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "nhìn phía sau",
      },
      contrast_group: "back_view",
    },
    {
      id: "lion_front",
      label: "chú sư tử nhìn thẳng",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "owl_front",
      label: "chú cú nhìn thẳng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🦉",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "clock_front",
      label: "đồng hồ nhìn thẳng",
      value: 7,
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      category: {
        type: "góc nhìn khác",
      },
      contrast_group: "other_view",
    },
    {
      id: "tv_front",
      label: "ti vi nhìn thẳng",
      value: 8,
      image: {
        kind: "emoji",
        ref: "📺",
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
      source_id: "backpack_back",
      target_id: "lion_front",
      metadata: {
        dimension: "perspective",
      },
    },
    {
      type: "contrast",
      source_id: "turtle_back",
      target_id: "owl_front",
      metadata: {
        dimension: "perspective",
      },
    },
    {
      type: "pair",
      source_id: "backpack_back",
      target_id: "turtle_back",
      metadata: {
        relation: "cùng nhìn sau",
      },
    },
    {
      type: "pair",
      source_id: "lion_front",
      target_id: "owl_front",
      metadata: {
        relation: "cùng nhìn khác",
      },
    },
  ],
  axes: {
    perspective: {
      values: ["nhìn phía sau", "góc nhìn khác"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhìn từ phía sau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhìn từ phía sau",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhìn từ phía sau nhé",
  },
  ordering: [
    "backpack_back",
    "turtle_back",
    "ladybug_back",
    "chair_back",
    "lion_front",
    "owl_front",
    "clock_front",
    "tv_front",
  ],
};

export const C2_PER_02_SEED: SkillSeed = {
  identity: C2_PER_02_IDENTITY,
  dataset: C2_PER_02_DATASET,
  levels: [
    {
      code: "GL-C2-PER-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-PER-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
