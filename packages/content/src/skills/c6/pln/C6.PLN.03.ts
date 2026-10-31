import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PLN_03_IDENTITY: SkillIdentity = {
  code: "C6.PLN.03",
  strand_code: "C6.PLN",
  competency_code: "C6",
  name: "Thử trong đầu trước khi thao tác",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["plan", "predict"],
  tier: "advanced",
  prerequisites: ["C6.PLN.01"],
  learning_objectives: [
    {
      code: "LO-C6.PLN.03-01",
      behaviour:
        "Nhận biết và thực hành Thử trong đầu trước khi thao tác ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PLN.03-02",
      behaviour:
        "Vận dụng Thử trong đầu trước khi thao tác trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PLN.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thử trong đầu trước khi thao tác",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PLN_03_DATASET: SkillDataset = {
  skill_code: "C6.PLN.03",
  concept_label: "Suy nghĩ trước khi làm",
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
        type: "chăm sóc cây",
        color: "green",
        shape: "triangle",
      },
      value: 1,
      ordering: 1,
      contrast_group: "grow_step",
    },
    {
      id: "herb",
      label: "cây mọc lá",
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      category: {
        type: "chăm sóc cây",
        color: "green",
        shape: "triangle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "grow_step",
    },
    {
      id: "tree",
      label: "cây vươn cao",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "chăm sóc cây",
        color: "green",
        shape: "circle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "grow_step",
    },
    {
      id: "cherry_blossom",
      label: "cây trổ hoa",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "chăm sóc cây",
        color: "red",
        shape: "circle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "grow_step",
    },
    {
      id: "cucumber",
      label: "quả dưa chuột",
      image: {
        kind: "emoji",
        ref: "🥒",
      },
      category: {
        type: "thu hoạch quả",
        color: "green",
        shape: "square",
      },
      value: 5,
      ordering: 5,
      contrast_group: "harvest_step",
    },
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "thu hoạch quả",
        color: "red",
        shape: "triangle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "harvest_step",
    },
    {
      id: "corn",
      label: "bắp ngô vàng",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "thu hoạch quả",
        color: "yellow",
        shape: "triangle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "harvest_step",
    },
    {
      id: "basket",
      label: "giỏ thu hoạch",
      image: {
        kind: "emoji",
        ref: "🧺",
      },
      category: {
        type: "thu hoạch quả",
        color: "yellow",
        shape: "square",
      },
      value: 8,
      ordering: 8,
      contrast_group: "harvest_step",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Thử trong đầu trước khi thao tác",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thử trong đầu trước khi thao tác",
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
    narration_template: "Chúng mình cùng ngắm kỹ và nghĩ cách làm trước nhé",
  },
  axes: {
    type: ["chăm sóc cây", "thu hoạch quả"],
    step: {
      values: ["nghĩ trước", "thử nghiệm", "chọn lọc", "thực hiện"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "seed",
      target_id: "herb",
      type: "sequence",
    },
    {
      source_id: "herb",
      target_id: "tree",
      type: "sequence",
    },
    {
      source_id: "tree",
      target_id: "cherry_blossom",
      type: "sequence",
    },
    {
      source_id: "cherry_blossom",
      target_id: "cucumber",
      type: "sequence",
    },
  ],
  ordering: [
    "seed",
    "herb",
    "tree",
    "cherry_blossom",
    "cucumber",
    "carrot",
    "corn",
    "basket",
  ],
};

export const C6_PLN_03_SEED: SkillSeed = {
  identity: C6_PLN_03_IDENTITY,
  dataset: C6_PLN_03_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C6-PLN-FIN-0001",
      template: "GT-024",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-FIN-0002",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SHAD-0003",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SIZE-0003",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
  ],
};
