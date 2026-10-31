import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_05_IDENTITY: SkillIdentity = {
  code: "C3.ALG.05",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Tìm bước nhầm trong chuỗi",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["verify", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.ALG.03", "C3.RULE.03"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.05-01",
      behaviour: "Nhận biết và thực hành Tìm bước sai trong chuỗi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.05-02",
      behaviour: "Vận dụng Tìm bước sai trong chuỗi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm bước sai trong chuỗi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_05_DATASET: SkillDataset = {
  skill_code: "C3.ALG.05",
  concept_label: "Tìm bước nhầm trong chuỗi",
  surface: "game",
  items: [
    {
      id: "basket",
      label: "chọn giỏ rau",
      image: {
        kind: "emoji",
        ref: "🧺",
      },
      category: {
        type: "sơ chế rau",
        color: "yellow",
        shape: "square",
        size: "large",
      },
      contrast_group: "prep_step",
      value: 1,
      ordering: 1,
    },
    {
      id: "carrot",
      label: "rửa cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "sơ chế rau",
        color: "red",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "prep_step",
      value: 2,
      ordering: 2,
    },
    {
      id: "corn",
      label: "bóc bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "sơ chế rau",
        color: "yellow",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "prep_step",
      value: 3,
      ordering: 3,
    },
    {
      id: "broccoli",
      label: "cắt súp lơ",
      image: {
        kind: "emoji",
        ref: "🥦",
      },
      category: {
        type: "sơ chế rau",
        color: "green",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "prep_step",
      value: 4,
      ordering: 4,
    },
    {
      id: "cooking_pot",
      label: "nấu nồi canh",
      image: {
        kind: "emoji",
        ref: "🍲",
      },
      category: {
        type: "nấu món ăn",
        color: "red",
        shape: "circle",
        size: "large",
      },
      contrast_group: "cook_step",
      value: 5,
      ordering: 5,
    },
    {
      id: "bowl",
      label: "múc ra bát",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "nấu món ăn",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "cook_step",
      value: 6,
      ordering: 6,
    },
    {
      id: "spoon",
      label: "xếp cái thìa",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "nấu món ăn",
        color: "yellow",
        shape: "triangle",
        size: "small",
      },
      contrast_group: "cook_step",
      value: 7,
      ordering: 7,
    },
    {
      id: "chair",
      label: "ngồi vào bàn",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "nấu món ăn",
        color: "yellow",
        shape: "square",
        size: "large",
      },
      contrast_group: "cook_step",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "basket",
      target_id: "carrot",
      explanation: "chọn giỏ rau rồi rửa cà rốt",
    },
    {
      type: "sequence",
      source_id: "carrot",
      target_id: "corn",
      explanation: "rửa cà rốt rồi bóc bắp ngô",
    },
    {
      type: "sequence",
      source_id: "corn",
      target_id: "broccoli",
      explanation: "bóc bắp ngô rồi cắt súp lơ",
    },
    {
      type: "sequence",
      source_id: "broccoli",
      target_id: "cooking_pot",
      explanation: "cắt súp lơ rồi nấu nồi canh",
    },
    {
      type: "sequence",
      source_id: "cooking_pot",
      target_id: "bowl",
      explanation: "nấu nồi canh rồi múc ra bát",
    },
    {
      type: "sequence",
      source_id: "bowl",
      target_id: "spoon",
      explanation: "múc ra bát rồi xếp cái thìa",
    },
    {
      type: "sequence",
      source_id: "spoon",
      target_id: "chair",
      explanation: "xếp cái thìa rồi ngồi vào bàn",
    },
  ],
  axes: {
    type: ["sơ chế rau", "nấu món ăn"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với tìm bước nhầm trong chuỗi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tìm bước nhầm trong chuỗi",
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
      "Chúng mình cùng tinh mắt tìm bước bị nhầm trong chuỗi nhé",
  },
  ordering: [
    "basket",
    "carrot",
    "corn",
    "broccoli",
    "cooking_pot",
    "bowl",
    "spoon",
    "chair",
  ],
};

export const C3_ALG_05_SEED: SkillSeed = {
  identity: C3_ALG_05_IDENTITY,
  dataset: C3_ALG_05_DATASET,
  levels: [
    {
      code: "GL-C3-ALG-MEAS-0001",
      template: "GT-028",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-TIME-0001",
      template: "GT-029",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-COIN-0001",
      template: "GT-030",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-VENN-0001",
      template: "GT-032",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-CMD-0005",
      template: "GT-035",
      band: "5-6",
      difficulty: 1,
      theme: "space",
      rounds: 3,
    },
  ],
};
