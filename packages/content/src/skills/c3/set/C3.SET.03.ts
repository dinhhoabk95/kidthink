import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SET_03_IDENTITY: SkillIdentity = {
  code: "C3.SET.03",
  strand_code: "C3.SET",
  competency_code: "C3",
  name: "Nhóm con trong nhóm lớn",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sort", "infer"],
  tier: "advanced",
  prerequisites: ["C3.SET.01", "C3.CLS.06"],
  learning_objectives: [
    {
      code: "LO-C3.SET.03-01",
      behaviour: "Nhận biết và thực hành Nhóm con trong nhóm lớn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SET.03-02",
      behaviour: "Vận dụng Nhóm con trong nhóm lớn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SET.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhóm con trong nhóm lớn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SET_03_DATASET: SkillDataset = {
  skill_code: "C3.SET.03",
  concept_label: "Nhóm con trong nhóm lớn",
  surface: "game",
  items: [
    {
      id: "ball",
      label: "quả bóng tròn",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "đồ chơi vui",
        color: "black",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "toys",
      value: 1,
      ordering: 1,
    },
    {
      id: "kite",
      label: "cánh diều bay",
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      category: {
        type: "đồ chơi vui",
        color: "red",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "toys",
      value: 2,
      ordering: 2,
    },
    {
      id: "yoyo",
      label: "con quay nhỏ",
      image: {
        kind: "emoji",
        ref: "🪀",
      },
      category: {
        type: "đồ chơi vui",
        color: "green",
        shape: "circle",
        size: "small",
      },
      contrast_group: "toys",
      value: 3,
      ordering: 3,
    },
    {
      id: "balloon",
      label: "bóng bay đỏ",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "đồ chơi vui",
        color: "red",
        shape: "circle",
        size: "small",
      },
      contrast_group: "toys",
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
      type: "subset",
      source_id: "ball",
      target_id: "balloon",
      explanation: "bóng tròn và bóng bay cùng là đồ chơi",
    },
    {
      type: "subset",
      source_id: "kite",
      target_id: "yoyo",
      explanation: "diều và con quay cùng là đồ chơi",
    },
    {
      type: "subset",
      source_id: "fish",
      target_id: "dolphin",
      explanation: "cá nhỏ và cá heo đều sống dưới biển",
    },
    {
      type: "subset",
      source_id: "crab",
      target_id: "turtle",
      explanation: "cua và rùa đều sống dưới biển",
    },
  ],
  axes: {
    type: ["đồ chơi vui", "sinh vật biển"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với nhóm con trong nhóm lớn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng nhóm con trong nhóm lớn",
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
      "Chúng mình cùng tìm nhóm đồ vật nhỏ nằm trong nhóm lớn nhé",
  },
  ordering: [
    "ball",
    "kite",
    "yoyo",
    "balloon",
    "fish",
    "crab",
    "turtle",
    "dolphin",
  ],
};

export const C3_SET_03_SEED: SkillSeed = {
  identity: C3_SET_03_IDENTITY,
  dataset: C3_SET_03_DATASET,
  levels: [
    {
      code: "GL-C3-SET-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-TCMP-0006",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
  ],
};
