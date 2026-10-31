import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_OTO_01_IDENTITY: SkillIdentity = {
  code: "C1.OTO.01",
  strand_code: "C1.OTO",
  competency_code: "C1",
  name: "Ghép 1-1",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["match"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.OTO.01-01",
      behaviour: "Nhận biết và thực hành Ghép 1-1 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.OTO.01-02",
      behaviour: "Vận dụng Ghép 1-1 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.OTO.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép 1-1",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_OTO_01_DATASET: SkillDataset = {
  skill_code: "C1.OTO.01",
  concept_label: "Ghép 1-1",
  surface: "game",
  items: [
    {
      id: "rabbit",
      label: "chú thỏ trắng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🐇",
      },
      contrast_group: "animal",
      category: {
        type: "con vật",
      },
    },
    {
      id: "carrot",
      label: "củ cà rốt",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      contrast_group: "food",
      category: {
        type: "thức ăn",
      },
    },
    {
      id: "cat",
      label: "chú mèo con",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      contrast_group: "animal",
      category: {
        type: "con vật",
      },
    },
    {
      id: "fish",
      label: "con cá nhỏ",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      contrast_group: "food",
      category: {
        type: "thức ăn",
      },
    },
    {
      id: "dog",
      label: "chú cún con",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      contrast_group: "animal",
      category: {
        type: "con vật",
      },
    },
    {
      id: "bone",
      label: "khúc xương trắng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🦴",
      },
      contrast_group: "food",
      category: {
        type: "thức ăn",
      },
    },
    {
      id: "monkey",
      label: "chú khỉ tinh nghịch",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🐒",
      },
      contrast_group: "animal",
      category: {
        type: "con vật",
      },
    },
    {
      id: "banana",
      label: "quả chuối vàng",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      contrast_group: "food",
      category: {
        type: "thức ăn",
      },
    },
    {
      id: "squirrel",
      label: "chú sóc nhỏ",
      value: 9,
      image: {
        kind: "emoji",
        ref: "🐿️",
      },
      contrast_group: "animal",
      category: {
        type: "con vật",
      },
    },
    {
      id: "acorn",
      label: "hạt dẻ nâu",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🌰",
      },
      contrast_group: "food",
      category: {
        type: "thức ăn",
      },
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "rabbit",
      target_id: "carrot",
      metadata: {
        relation: "one_to_one",
      },
    },
    {
      type: "pair",
      source_id: "cat",
      target_id: "fish",
      metadata: {
        relation: "one_to_one",
      },
    },
    {
      type: "pair",
      source_id: "dog",
      target_id: "bone",
      metadata: {
        relation: "one_to_one",
      },
    },
    {
      type: "pair",
      source_id: "monkey",
      target_id: "banana",
      metadata: {
        relation: "one_to_one",
      },
    },
    {
      type: "pair",
      source_id: "squirrel",
      target_id: "acorn",
      metadata: {
        relation: "one_to_one",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ghép 1-1",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng ghép 1-1",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt ghép 1-1 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi ghép 1-1",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục ghép 1-1 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy nối mỗi bạn với đúng thức ăn tương ứng nhé!",
    narration_template:
      "Mỗi bạn nhỏ có một phần quà, chúng mình cùng ghép đôi tương ứng 1-1 nhé",
  },
  ordering: [
    "rabbit",
    "carrot",
    "cat",
    "fish",
    "dog",
    "bone",
    "monkey",
    "banana",
    "squirrel",
    "acorn",
  ],
};

export const C1_OTO_01_SEED: SkillSeed = {
  identity: C1_OTO_01_IDENTITY,
  dataset: C1_OTO_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
    },
    {
      code: "GL-C1-OTO-CARD-0103",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB01-D2",
    },
    {
      code: "GL-C1-OTO-TAP-0101",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB00-D2",
    },
    {
      code: "GL-C1-OTO-PAIR-0101",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB01-D2",
    },
    {
      code: "GL-C1-OTO-PAIR-0102",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB01-D2",
    },
    {
      code: "GL-C1-OTO-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "nature",
      rounds: 3,
    },
  ],
};
