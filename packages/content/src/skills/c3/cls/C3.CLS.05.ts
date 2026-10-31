import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_CLS_05_IDENTITY: SkillIdentity = {
  code: "C3.CLS.05",
  strand_code: "C3.CLS",
  competency_code: "C3",
  name: "Phân loại theo số lượng",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sort", "count"],
  tier: "core",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C3.CLS.05-01",
      behaviour: "Nhận biết và thực hành Phân loại theo số lượng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.CLS.05-02",
      behaviour: "Vận dụng Phân loại theo số lượng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.CLS.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân loại theo số lượng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_CLS_05_DATASET: SkillDataset = {
  skill_code: "C3.CLS.05",
  concept_label: "Phân loại theo số lượng",
  surface: "game",
  items: [
    {
      id: "clownfish",
      label: "cá hề nhỏ",
      image: {
        kind: "emoji",
        ref: "🐠",
      },
      category: {
        type: "thú dưới nước",
        color: "yellow",
        shape: "triangle",
        size: "small",
      },
      contrast_group: "water_animals",
      value: 1,
      ordering: 1,
    },
    {
      id: "dolphin",
      label: "cá heo xanh",
      image: {
        kind: "emoji",
        ref: "🐬",
      },
      category: {
        type: "thú dưới nước",
        color: "blue",
        shape: "circle",
        size: "large",
      },
      contrast_group: "water_animals",
      value: 2,
      ordering: 2,
    },
    {
      id: "crab",
      label: "con cua đỏ",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      category: {
        type: "thú dưới nước",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "water_animals",
      value: 3,
      ordering: 3,
    },
    {
      id: "turtle",
      label: "rùa biển bơi",
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      category: {
        type: "thú dưới nước",
        color: "green",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "water_animals",
      value: 4,
      ordering: 4,
    },
    {
      id: "elephant",
      label: "chú voi to",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "thú trên cạn",
        color: "blue",
        shape: "circle",
        size: "large",
      },
      contrast_group: "land_animals",
      value: 5,
      ordering: 5,
    },
    {
      id: "monkey",
      label: "chú khỉ con",
      image: {
        kind: "emoji",
        ref: "🐵",
      },
      category: {
        type: "thú trên cạn",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "land_animals",
      value: 6,
      ordering: 6,
    },
    {
      id: "giraffe",
      label: "hươu cao cổ",
      image: {
        kind: "emoji",
        ref: "🦒",
      },
      category: {
        type: "thú trên cạn",
        color: "yellow",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "land_animals",
      value: 7,
      ordering: 7,
    },
    {
      id: "rabbit",
      label: "chú thỏ trắng",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "thú trên cạn",
        color: "white",
        shape: "circle",
        size: "small",
      },
      contrast_group: "land_animals",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "clownfish",
      target_id: "elephant",
      explanation: "cá hề sống dưới nước khác voi sống trên cạn",
    },
    {
      type: "contrast",
      source_id: "dolphin",
      target_id: "monkey",
      explanation: "cá heo sống dưới nước khác khỉ sống trên cạn",
    },
    {
      type: "contrast",
      source_id: "crab",
      target_id: "giraffe",
      explanation: "cua sống dưới nước khác hươu sống trên cạn",
    },
    {
      type: "contrast",
      source_id: "turtle",
      target_id: "rabbit",
      explanation: "rùa biển sống dưới nước khác thỏ sống trên cạn",
    },
  ],
  axes: {
    type: ["thú dưới nước", "thú trên cạn"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với phân loại theo số lượng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng phân loại theo số lượng",
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
    narration_template: "Chúng mình cùng phân loại các con vật theo nhóm nhé",
  },
  ordering: [
    "clownfish",
    "dolphin",
    "crab",
    "turtle",
    "elephant",
    "monkey",
    "giraffe",
    "rabbit",
  ],
};

export const C3_CLS_05_SEED: SkillSeed = {
  identity: C3_CLS_05_IDENTITY,
  dataset: C3_CLS_05_DATASET,
  levels: [
    {
      code: "GL-C3-COL-BSK-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-COL-BSK-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-CLS-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
