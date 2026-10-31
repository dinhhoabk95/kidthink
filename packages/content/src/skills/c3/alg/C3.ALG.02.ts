import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_02_IDENTITY: SkillIdentity = {
  code: "C3.ALG.02",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Làm theo các bước",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["sequence", "plan"],
  tier: "core",
  prerequisites: ["C3.ALG.01"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.02-01",
      behaviour: "Nhận biết và thực hành Làm theo chuỗi 3–4 lệnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.02-02",
      behaviour: "Vận dụng Làm theo chuỗi 3–4 lệnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Làm theo chuỗi 3–4 lệnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_02_DATASET: SkillDataset = {
  skill_code: "C3.ALG.02",
  concept_label: "Làm theo các bước",
  surface: "game",
  items: [
    {
      id: "seed",
      label: "gieo hạt mầm",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "trồng cây non",
        color: "green",
        shape: "circle",
        size: "small",
      },
      contrast_group: "step_grow",
      value: 1,
      ordering: 1,
    },
    {
      id: "watering",
      label: "tưới nước mát",
      image: {
        kind: "emoji",
        ref: "🚿",
      },
      category: {
        type: "trồng cây non",
        color: "blue",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "step_grow",
      value: 2,
      ordering: 2,
    },
    {
      id: "sunshine",
      label: "đón nắng ấm",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "trồng cây non",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "step_grow",
      value: 3,
      ordering: 3,
    },
    {
      id: "herb_leaf",
      label: "cây ra lá",
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      category: {
        type: "trồng cây non",
        color: "green",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "step_grow",
      value: 4,
      ordering: 4,
    },
    {
      id: "blossom",
      label: "cây nở hoa",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "thu hoạch quả",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "step_harvest",
      value: 5,
      ordering: 5,
    },
    {
      id: "red_apple",
      label: "quả chín đỏ",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "thu hoạch quả",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "step_harvest",
      value: 6,
      ordering: 6,
    },
    {
      id: "basket",
      label: "hái vào giỏ",
      image: {
        kind: "emoji",
        ref: "🧺",
      },
      category: {
        type: "thu hoạch quả",
        color: "yellow",
        shape: "square",
        size: "large",
      },
      contrast_group: "step_harvest",
      value: 7,
      ordering: 7,
    },
    {
      id: "plate_fruit",
      label: "bày ra đĩa",
      image: {
        kind: "emoji",
        ref: "🍽️",
      },
      category: {
        type: "thu hoạch quả",
        color: "white",
        shape: "circle",
        size: "large",
      },
      contrast_group: "step_harvest",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "seed",
      target_id: "watering",
      explanation: "gieo hạt mầm rồi tưới nước mát",
    },
    {
      type: "sequence",
      source_id: "watering",
      target_id: "sunshine",
      explanation: "tưới nước mát rồi đón nắng ấm",
    },
    {
      type: "sequence",
      source_id: "sunshine",
      target_id: "herb_leaf",
      explanation: "đón nắng ấm rồi cây ra lá",
    },
    {
      type: "sequence",
      source_id: "herb_leaf",
      target_id: "blossom",
      explanation: "cây ra lá rồi cây nở hoa",
    },
    {
      type: "sequence",
      source_id: "blossom",
      target_id: "red_apple",
      explanation: "cây nở hoa rồi kết quả chín đỏ",
    },
    {
      type: "sequence",
      source_id: "red_apple",
      target_id: "basket",
      explanation: "quả chín đỏ hái vào giỏ",
    },
    {
      type: "sequence",
      source_id: "basket",
      target_id: "plate_fruit",
      explanation: "hái vào giỏ rồi bày ra đĩa",
    },
  ],
  axes: {
    type: ["trồng cây non", "thu hoạch quả"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với làm theo các bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng làm theo các bước",
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
    narration_template: "Chúng mình cùng thực hiện lần lượt từng bước nhé",
  },
  ordering: [
    "seed",
    "watering",
    "sunshine",
    "herb_leaf",
    "blossom",
    "red_apple",
    "basket",
    "plate_fruit",
  ],
};

export const C3_ALG_02_SEED: SkillSeed = {
  identity: C3_ALG_02_IDENTITY,
  dataset: C3_ALG_02_DATASET,
  levels: [
    {
      code: "GL-C3-ALG-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SHAD-0003",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-BLD-0001",
      template: "GT-023",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
  ],
};
