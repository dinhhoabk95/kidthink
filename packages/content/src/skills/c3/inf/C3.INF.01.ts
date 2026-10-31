import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_INF_01_IDENTITY: SkillIdentity = {
  code: "C3.INF.01",
  strand_code: "C3.INF",
  competency_code: "C3",
  name: "Đoán vật còn thiếu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["infer"],
  tier: "core",
  prerequisites: ["C3.ANA.01"],
  learning_objectives: [
    {
      code: "LO-C3.INF.01-01",
      behaviour: "Nhận biết và thực hành Đoán vật còn thiếu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.INF.01-02",
      behaviour: "Vận dụng Đoán vật còn thiếu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.INF.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đoán vật còn thiếu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_INF_01_DATASET: SkillDataset = {
  skill_code: "C3.INF.01",
  concept_label: "Đoán vật còn thiếu",
  surface: "game",
  items: [
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
      value: 1,
      ordering: 1,
    },
    {
      id: "jellyfish",
      label: "con sứa biển",
      image: {
        kind: "emoji",
        ref: "🪼",
      },
      category: {
        type: "sinh vật biển",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "ocean_life",
      value: 2,
      ordering: 2,
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
      value: 3,
      ordering: 3,
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
      value: 4,
      ordering: 4,
    },
    {
      id: "rose",
      label: "bông hoa hồng",
      image: {
        kind: "emoji",
        ref: "🌹",
      },
      category: {
        type: "hoa cỏ đẹp",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "nature_plants",
      value: 5,
      ordering: 5,
    },
    {
      id: "sunflower",
      label: "hoa hướng dương",
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      category: {
        type: "hoa cỏ đẹp",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "nature_plants",
      value: 6,
      ordering: 6,
    },
    {
      id: "cactus",
      label: "cây xương rồng",
      image: {
        kind: "emoji",
        ref: "🌵",
      },
      category: {
        type: "hoa cỏ đẹp",
        color: "green",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "nature_plants",
      value: 7,
      ordering: 7,
    },
    {
      id: "rainbow",
      label: "dải cầu vồng",
      image: {
        kind: "emoji",
        ref: "🌈",
      },
      category: {
        type: "hoa cỏ đẹp",
        color: "red",
        shape: "circle",
        size: "large",
      },
      contrast_group: "nature_plants",
      value: 8,
      ordering: 8,
    },
    {
      id: "ws_joystick_red",
      label: "cần gạt đỏ",
      image: {
        kind: "emoji",
        ref: "🕹️",
      },
      value: 1,
    },
    {
      id: "ws_button_blue",
      label: "nút bấm xanh",
      image: {
        kind: "emoji",
        ref: "🔘",
      },
      value: 2,
    },
    {
      id: "ws_cupcake_strawberry",
      label: "bánh cupcake dâu",
      image: {
        kind: "emoji",
        ref: "🧁",
      },
      value: 3,
    },
    {
      id: "ws_cookie_star",
      label: "bánh quy ngôi sao",
      image: {
        kind: "emoji",
        ref: "🍪",
      },
      value: 4,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "crab",
      target_id: "jellyfish",
      explanation: "cua đỏ cùng bơi với sứa biển",
    },
    {
      type: "pair",
      source_id: "fish",
      target_id: "dolphin",
      explanation: "cá nhỏ cùng bơi với cá heo",
    },
    {
      type: "pair",
      source_id: "rose",
      target_id: "sunflower",
      explanation: "hoa hồng nở cùng hoa hướng dương",
    },
    {
      type: "pair",
      source_id: "cactus",
      target_id: "rainbow",
      explanation: "cây xương rồng đón dải cầu vồng",
    },
  ],
  axes: {
    type: ["sinh vật biển", "hoa cỏ đẹp"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đoán vật còn thiếu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đoán vật còn thiếu",
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
    narration_template: "Chúng mình cùng tìm xem đồ vật nào còn thiếu nhé",
  },
  ordering: [
    "crab",
    "jellyfish",
    "fish",
    "dolphin",
    "rose",
    "sunflower",
    "cactus",
    "rainbow",
    "ws_joystick_red",
    "ws_button_blue",
    "ws_cupcake_strawberry",
    "ws_cookie_star",
  ],
};

export const C3_INF_01_SEED: SkillSeed = {
  identity: C3_INF_01_IDENTITY,
  dataset: C3_INF_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C3-ODD-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-TIME-0001",
      template: "GT-029",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C3-INF-SUBST-0201",
      template: "GT-010",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "job",
      rounds: 3,
      montessori_ref: "WB12-D1",
    },
    {
      code: "GL-C3-INF-TAP-0202",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "food",
      rounds: 3,
      montessori_ref: "WB12-D2",
    },
  ],
};
