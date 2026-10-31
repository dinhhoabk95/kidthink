import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SET_05_IDENTITY: SkillIdentity = {
  code: "C3.SET.05",
  strand_code: "C3.SET",
  competency_code: "C3",
  name: "Vật có cả hai đặc điểm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["deduce", "sort"],
  tier: "advanced",
  prerequisites: ["C3.SET.04"],
  learning_objectives: [
    {
      code: "LO-C3.SET.05-01",
      behaviour: "Nhận biết và thực hành Vừa … vừa … ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SET.05-02",
      behaviour: "Vận dụng Vừa … vừa … trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SET.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Vừa … vừa …",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SET_05_DATASET: SkillDataset = {
  skill_code: "C3.SET.05",
  concept_label: "Vật có cả hai đặc điểm",
  surface: "game",
  items: [
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ tươi",
        color: "red",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "vegetables",
      value: 1,
      ordering: 1,
    },
    {
      id: "corn",
      label: "bắp ngô vàng",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "rau củ tươi",
        color: "yellow",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "vegetables",
      value: 2,
      ordering: 2,
    },
    {
      id: "tomato",
      label: "quả cà chua",
      image: {
        kind: "emoji",
        ref: "🍅",
      },
      category: {
        type: "rau củ tươi",
        color: "red",
        shape: "circle",
        size: "small",
      },
      contrast_group: "vegetables",
      value: 3,
      ordering: 3,
    },
    {
      id: "broccoli",
      label: "cây súp lơ",
      image: {
        kind: "emoji",
        ref: "🥦",
      },
      category: {
        type: "rau củ tươi",
        color: "green",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "vegetables",
      value: 4,
      ordering: 4,
    },
    {
      id: "fish",
      label: "con cá nhỏ",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "sinh vật biển",
        color: "blue",
        shape: "triangle",
        size: "small",
      },
      contrast_group: "ocean_life",
      value: 5,
      ordering: 5,
    },
    {
      id: "crab",
      label: "con cua đỏ",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      category: {
        type: "sinh vật biển",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "ocean_life",
      value: 6,
      ordering: 6,
    },
    {
      id: "turtle",
      label: "rùa biển bơi",
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      category: {
        type: "sinh vật biển",
        color: "green",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "ocean_life",
      value: 7,
      ordering: 7,
    },
    {
      id: "dolphin",
      label: "chú cá heo",
      image: {
        kind: "emoji",
        ref: "🐬",
      },
      category: {
        type: "sinh vật biển",
        color: "blue",
        shape: "circle",
        size: "large",
      },
      contrast_group: "ocean_life",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "carrot",
      target_id: "fish",
      explanation: "cà rốt và cá nhỏ cùng có hình tam giác",
    },
    {
      type: "pair",
      source_id: "tomato",
      target_id: "crab",
      explanation: "cà chua và con cua cùng có màu đỏ",
    },
    {
      type: "pair",
      source_id: "broccoli",
      target_id: "turtle",
      explanation: "súp lơ và rùa biển cùng có màu xanh",
    },
    {
      type: "pair",
      source_id: "corn",
      target_id: "dolphin",
      explanation: "bắp ngô và cá heo cùng có kích thước lớn",
    },
  ],
  axes: {
    type: ["rau củ tươi", "sinh vật biển"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với vật có cả hai đặc điểm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng vật có cả hai đặc điểm",
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
    narration_template: "Chúng mình cùng tìm vật có cả hai đặc điểm nhé",
  },
  ordering: [
    "carrot",
    "corn",
    "tomato",
    "broccoli",
    "fish",
    "crab",
    "turtle",
    "dolphin",
  ],
};

export const C3_SET_05_SEED: SkillSeed = {
  identity: C3_SET_05_IDENTITY,
  dataset: C3_SET_05_DATASET,
  levels: [
    {
      code: "GL-C3-SET-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-TCNT-0008",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
