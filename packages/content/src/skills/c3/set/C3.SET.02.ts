import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SET_02_IDENTITY: SkillIdentity = {
  code: "C3.SET.02",
  strand_code: "C3.SET",
  competency_code: "C3",
  name: "Vật lạ trong nhóm",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["compare", "deduce"],
  tier: "basic",
  prerequisites: ["C3.SET.01"],
  learning_objectives: [
    {
      code: "LO-C3.SET.02-01",
      behaviour: "Nhận biết và thực hành Vật lạ trong nhóm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SET.02-02",
      behaviour: "Vận dụng Vật lạ trong nhóm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SET.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Vật lạ trong nhóm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SET_02_DATASET: SkillDataset = {
  skill_code: "C3.SET.02",
  concept_label: "Vật lạ trong nhóm",
  surface: "game",
  items: [
    {
      id: "cup",
      label: "cái cốc nhỏ",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "đồ gia đình",
        color: "white",
        shape: "circle",
        size: "small",
      },
      contrast_group: "home_items",
      value: 1,
      ordering: 1,
    },
    {
      id: "bowl",
      label: "chiếc bát ăn",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ gia đình",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "home_items",
      value: 2,
      ordering: 2,
    },
    {
      id: "spoon",
      label: "chiếc thìa xúc",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ gia đình",
        color: "yellow",
        shape: "triangle",
        size: "small",
      },
      contrast_group: "home_items",
      value: 3,
      ordering: 3,
    },
    {
      id: "plate",
      label: "chiếc đĩa tròn",
      image: {
        kind: "emoji",
        ref: "🍽️",
      },
      category: {
        type: "đồ gia đình",
        color: "white",
        shape: "circle",
        size: "large",
      },
      contrast_group: "home_items",
      value: 4,
      ordering: 4,
    },
    {
      id: "car",
      label: "xe ô-tô con",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "xe cộ chạy",
        color: "red",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "vehicles",
      value: 5,
      ordering: 5,
    },
    {
      id: "bus",
      label: "chiếc xe buýt",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "xe cộ chạy",
        color: "yellow",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "vehicles",
      value: 6,
      ordering: 6,
    },
    {
      id: "bike",
      label: "chiếc xe đạp",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "xe cộ chạy",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "vehicles",
      value: 7,
      ordering: 7,
    },
    {
      id: "train",
      label: "tàu hỏa dài",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "xe cộ chạy",
        color: "black",
        shape: "rectangle",
        size: "large",
      },
      contrast_group: "vehicles",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "cup",
      target_id: "car",
      explanation: "cốc uống nước khác ô-tô đi trên đường",
    },
    {
      type: "contrast",
      source_id: "bowl",
      target_id: "bus",
      explanation: "bát ăn cơm khác xe buýt chở khách",
    },
    {
      type: "contrast",
      source_id: "spoon",
      target_id: "bike",
      explanation: "thìa xúc canh khác xe đạp dạo phố",
    },
    {
      type: "contrast",
      source_id: "plate",
      target_id: "train",
      explanation: "đĩa đựng đồ khác tàu hỏa chạy ray",
    },
  ],
  axes: {
    type: ["đồ gia đình", "xe cộ chạy"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với vật lạ trong nhóm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng vật lạ trong nhóm",
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
      "Chúng mình cùng tinh mắt tìm vật khác biệt trong nhóm nhé",
  },
  ordering: ["cup", "bowl", "spoon", "plate", "car", "bus", "bike", "train"],
};

export const C3_SET_02_SEED: SkillSeed = {
  identity: C3_SET_02_IDENTITY,
  dataset: C3_SET_02_DATASET,
  levels: [
    {
      code: "GL-C3-SET-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
