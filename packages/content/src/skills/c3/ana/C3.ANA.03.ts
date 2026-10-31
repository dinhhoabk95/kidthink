import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ANA_03_IDENTITY: SkillIdentity = {
  code: "C3.ANA.03",
  strand_code: "C3.ANA",
  competency_code: "C3",
  name: "Tìm cặp tương ứng theo mẫu",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["infer", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.ANA.02"],
  learning_objectives: [
    {
      code: "LO-C3.ANA.03-01",
      behaviour: "Nhận biết và thực hành A : B = C : ? ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ANA.03-02",
      behaviour: "Vận dụng A : B = C : ? trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ANA.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới A : B = C : ?",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ANA_03_DATASET: SkillDataset = {
  skill_code: "C3.ANA.03",
  concept_label: "Tìm cặp tương ứng theo mẫu",
  surface: "game",
  items: [
    {
      id: "rabbit",
      label: "chú thỏ trắng",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "con vật nhỏ",
        color: "white",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "animal",
      value: 1,
      ordering: 1,
    },
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "thức ăn ngon",
        color: "red",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "food",
      value: 2,
      ordering: 2,
    },
    {
      id: "monkey",
      label: "chú khỉ con",
      image: {
        kind: "emoji",
        ref: "🐵",
      },
      category: {
        type: "con vật nhỏ",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "animal",
      value: 3,
      ordering: 3,
    },
    {
      id: "banana",
      label: "quả chuối vàng",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "thức ăn ngon",
        color: "yellow",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "food",
      value: 4,
      ordering: 4,
    },
    {
      id: "cat",
      label: "chú mèo mướp",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "con vật nhỏ",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "animal",
      value: 5,
      ordering: 5,
    },
    {
      id: "fish",
      label: "con cá nhỏ",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "thức ăn ngon",
        color: "blue",
        shape: "triangle",
        size: "small",
      },
      contrast_group: "food",
      value: 6,
      ordering: 6,
    },
    {
      id: "bear",
      label: "chú gấu nâu",
      image: {
        kind: "emoji",
        ref: "🐻",
      },
      category: {
        type: "con vật nhỏ",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "animal",
      value: 7,
      ordering: 7,
    },
    {
      id: "honey",
      label: "hũ mật ong",
      image: {
        kind: "emoji",
        ref: "🍯",
      },
      category: {
        type: "thức ăn ngon",
        color: "yellow",
        shape: "square",
        size: "medium",
      },
      contrast_group: "food",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "rabbit",
      target_id: "carrot",
      explanation: "thỏ thích ăn củ cà rốt",
      metadata: { reason: "analogy" },
    },
    {
      type: "pair",
      source_id: "monkey",
      target_id: "banana",
      explanation: "khỉ thích ăn quả chuối",
      metadata: { reason: "analogy" },
    },
    {
      type: "pair",
      source_id: "cat",
      target_id: "fish",
      explanation: "mèo thích ăn con cá nhỏ",
      metadata: { reason: "analogy" },
    },
    {
      type: "pair",
      source_id: "bear",
      target_id: "honey",
      explanation: "gấu thích ăn hũ mật ong",
      metadata: { reason: "analogy" },
    },
  ],
  axes: {
    type: ["con vật nhỏ", "thức ăn ngon"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tìm cặp tương ứng theo mẫu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tìm cặp tương ứng theo mẫu",
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
      "Chúng mình cùng suy luận tìm cặp tương ứng giống với mẫu nhé",
  },
  ordering: [
    "rabbit",
    "carrot",
    "monkey",
    "banana",
    "cat",
    "fish",
    "bear",
    "honey",
  ],
};

export const C3_ANA_03_SEED: SkillSeed = {
  identity: C3_ANA_03_IDENTITY,
  dataset: C3_ANA_03_DATASET,
  levels: [
    {
      code: "GL-C3-ODD-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-RLF-BSK-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C3-RLF-BSK-0010",
      template: "GT-003",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C3-ANA-PUZZ-0003",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
  ],
};
