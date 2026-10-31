import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_DED_02_IDENTITY: SkillIdentity = {
  code: "C3.DED.02",
  strand_code: "C3.DED",
  competency_code: "C3",
  name: "Đoán điều xảy ra tiếp",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["deduce", "infer"],
  tier: "advanced",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C3.DED.02-01",
      behaviour: "Nhận biết và thực hành Nếu… thì… ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.DED.02-02",
      behaviour: "Vận dụng Nếu… thì… trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.DED.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nếu… thì…",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_DED_02_DATASET: SkillDataset = {
  skill_code: "C3.DED.02",
  concept_label: "Đoán điều xảy ra tiếp",
  surface: "game",
  items: [
    {
      id: "seed",
      label: "gieo hạt nhỏ",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "cây lớn lên",
        color: "green",
        shape: "circle",
        size: "small",
      },
      contrast_group: "plant_chain",
      value: 1,
      ordering: 1,
    },
    {
      id: "sprout",
      label: "mầm vươn lá",
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      category: {
        type: "cây lớn lên",
        color: "green",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "plant_chain",
      value: 2,
      ordering: 2,
    },
    {
      id: "flower",
      label: "hoa bung nở",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "cây lớn lên",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "plant_chain",
      value: 3,
      ordering: 3,
    },
    {
      id: "apple",
      label: "quả táo chín",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "cây lớn lên",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "plant_chain",
      value: 4,
      ordering: 4,
    },
    {
      id: "wheat",
      label: "hạt lúa vàng",
      image: {
        kind: "emoji",
        ref: "🌾",
      },
      category: {
        type: "làm bánh thơm",
        color: "yellow",
        shape: "triangle",
        size: "small",
      },
      contrast_group: "bread_chain",
      value: 5,
      ordering: 5,
    },
    {
      id: "bowl_flour",
      label: "nhào bột mịn",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "làm bánh thơm",
        color: "white",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "bread_chain",
      value: 6,
      ordering: 6,
    },
    {
      id: "croissant",
      label: "nướng bánh nở",
      image: {
        kind: "emoji",
        ref: "🥐",
      },
      category: {
        type: "làm bánh thơm",
        color: "yellow",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "bread_chain",
      value: 7,
      ordering: 7,
    },
    {
      id: "plate_cake",
      label: "bánh kem ngon",
      image: {
        kind: "emoji",
        ref: "🍰",
      },
      category: {
        type: "làm bánh thơm",
        color: "red",
        shape: "triangle",
        size: "large",
      },
      contrast_group: "bread_chain",
      value: 8,
      ordering: 8,
    },
    {
      id: "sign_forbidden",
      label: "biển báo cấm",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🚫",
      },
    },
    {
      id: "gold_key_secret",
      label: "chìa khóa cổ",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🗝️",
      },
    },
    {
      id: "clue_scroll",
      label: "cuộn giấy mật thư",
      value: 3,
      image: {
        kind: "emoji",
        ref: "📜",
      },
    },
    {
      id: "chest_silver",
      label: "rương bạc khóa kín",
      value: 4,
      image: {
        kind: "emoji",
        ref: "📦",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "seed",
      target_id: "sprout",
      explanation: "gieo hạt nhỏ mọc thành mầm non",
    },
    {
      type: "sequence",
      source_id: "sprout",
      target_id: "flower",
      explanation: "mầm non lớn lên nở thành hoa",
    },
    {
      type: "sequence",
      source_id: "flower",
      target_id: "apple",
      explanation: "hoa kết thành quả táo chín đỏ",
    },
    {
      type: "sequence",
      source_id: "wheat",
      target_id: "bowl_flour",
      explanation: "hạt lúa xay thành bột mịn",
    },
    {
      type: "sequence",
      source_id: "bowl_flour",
      target_id: "croissant",
      explanation: "bột mịn nướng thành bánh thơm",
    },
    {
      type: "sequence",
      source_id: "croissant",
      target_id: "plate_cake",
      explanation: "bánh nướng trang trí thành bánh kem ngon",
    },
  ],
  axes: {
    type: ["cây lớn lên", "làm bánh thơm"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đoán điều xảy ra tiếp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đoán điều xảy ra tiếp",
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
      "Chúng mình cùng suy luận xem điều gì sẽ xảy ra tiếp nhé",
  },
  ordering: [
    "seed",
    "sprout",
    "flower",
    "apple",
    "wheat",
    "bowl_flour",
    "croissant",
    "plate_cake",
    "sign_forbidden",
    "gold_key_secret",
    "clue_scroll",
    "chest_silver",
  ],
};

export const C3_DED_02_SEED: SkillSeed = {
  identity: C3_DED_02_IDENTITY,
  dataset: C3_DED_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C3-DED-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-DED-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 2,
      theme: "home",
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
    },
    {
      code: "GL-C3-DED-CLUE-0204",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D1",
    },
    {
      code: "GL-C3-DED-TAP-0205",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB14-D2",
    },
  ],
};
