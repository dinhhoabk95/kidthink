import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_WM_03_IDENTITY: SkillIdentity = {
  code: "C6.WM.03",
  strand_code: "C6.WM",
  competency_code: "C6",
  name: "Nhớ vị trí sau khi bị che",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["recall"],
  tier: "core",
  prerequisites: ["C4.MEM.01"],
  learning_objectives: [
    {
      code: "LO-C6.WM.03-01",
      behaviour:
        "Nhận biết và thực hành Nhớ vị trí sau khi bị che ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.WM.03-02",
      behaviour:
        "Vận dụng Nhớ vị trí sau khi bị che trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.WM.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhớ vị trí sau khi bị che",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_WM_03_DATASET: SkillDataset = {
  skill_code: "C6.WM.03",
  concept_label: "Nhớ vị trí sau khi bị che",
  surface: "game",
  items: [
    {
      id: "tulip",
      label: "hoa tu-líp",
      image: {
        kind: "emoji",
        ref: "🌷",
      },
      category: {
        type: "hoa cỏ đẹp",
        color: "red",
        shape: "circle",
      },
      value: 1,
      ordering: 1,
      contrast_group: "nature_flowers",
    },
    {
      id: "clover",
      label: "cỏ non",
      image: {
        kind: "emoji",
        ref: "🍀",
      },
      category: {
        type: "hoa cỏ đẹp",
        color: "green",
        shape: "triangle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "nature_flowers",
    },
    {
      id: "rainbow",
      label: "cầu vồng",
      image: {
        kind: "emoji",
        ref: "🌈",
      },
      category: {
        type: "hoa cỏ đẹp",
        color: "blue",
        shape: "circle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "nature_flowers",
    },
    {
      id: "rose",
      label: "hoa hồng",
      image: {
        kind: "emoji",
        ref: "🌹",
      },
      category: {
        type: "hoa cỏ đẹp",
        color: "red",
        shape: "circle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "nature_flowers",
    },
    {
      id: "balloon",
      label: "bóng bay",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "đồ chơi",
        color: "red",
        shape: "circle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "toys",
    },
    {
      id: "yoyo",
      label: "con quay",
      image: {
        kind: "emoji",
        ref: "🪀",
      },
      category: {
        type: "đồ chơi",
        color: "green",
        shape: "circle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "toys",
    },
    {
      id: "piano",
      label: "phím đàn",
      image: {
        kind: "emoji",
        ref: "🎹",
      },
      category: {
        type: "đồ chơi",
        color: "white",
        shape: "square",
      },
      value: 7,
      ordering: 7,
      contrast_group: "toys",
    },
    {
      id: "teddy",
      label: "gấu bông",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "đồ chơi",
        color: "yellow",
        shape: "circle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "toys",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhớ vị trí sau khi bị che",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ vị trí sau khi bị che",
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
    narration_template: "Chúng mình cùng ghi nhớ vị trí của hình nhé",
  },
  axes: {
    type: ["hoa cỏ đẹp", "đồ chơi"],
    position: {
      values: ["bên trái", "ở giữa", "bên phải", "phía trên"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "tulip",
      target_id: "clover",
      type: "pair",
    },
    {
      source_id: "rainbow",
      target_id: "rose",
      type: "pair",
    },
    {
      source_id: "balloon",
      target_id: "yoyo",
      type: "pair",
    },
    {
      source_id: "piano",
      target_id: "teddy",
      type: "pair",
    },
  ],
  ordering: [
    "tulip",
    "clover",
    "rainbow",
    "rose",
    "balloon",
    "yoyo",
    "piano",
    "teddy",
  ],
};

export const C6_WM_03_SEED: SkillSeed = {
  identity: C6_WM_03_IDENTITY,
  dataset: C6_WM_03_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C6-MEM-CARD-0001",
      template: "GT-012",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-CMP-0015",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLIP-0026",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-PAIR-0006",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-PAIR-0008",
      template: "GT-005",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
