import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SEQ_02_IDENTITY: SkillIdentity = {
  code: "C3.SEQ.02",
  strand_code: "C3.SEQ",
  competency_code: "C3",
  name: "Chuỗi số",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sequence", "predict"],
  tier: "core",
  prerequisites: ["C1.NREC.09"],
  learning_objectives: [
    {
      code: "LO-C3.SEQ.02-01",
      behaviour: "Nhận biết và thực hành Chuỗi số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SEQ.02-02",
      behaviour: "Vận dụng Chuỗi số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SEQ.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chuỗi số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SEQ_02_DATASET: SkillDataset = {
  skill_code: "C3.SEQ.02",
  concept_label: "Chuỗi số",
  surface: "game",
  items: [
    {
      id: "plant_seed",
      label: "gieo hạt giống",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "mầm cây non",
        color: "green",
        shape: "circle",
        size: "small",
      },
      contrast_group: "early_stage",
      value: 1,
      ordering: 1,
    },
    {
      id: "plant_water",
      label: "tưới nước mát",
      image: {
        kind: "emoji",
        ref: "🚿",
      },
      category: {
        type: "mầm cây non",
        color: "blue",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "early_stage",
      value: 2,
      ordering: 2,
    },
    {
      id: "plant_sprout",
      label: "hạt nảy mầm",
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      category: {
        type: "mầm cây non",
        color: "green",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "early_stage",
      value: 3,
      ordering: 3,
    },
    {
      id: "plant_leaf",
      label: "cây ra lá",
      image: {
        kind: "emoji",
        ref: "🪴",
      },
      category: {
        type: "cây trưởng thành",
        color: "green",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "late_stage",
      value: 4,
      ordering: 4,
    },
    {
      id: "plant_flower",
      label: "cây nở hoa",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "cây trưởng thành",
        color: "red",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "late_stage",
      value: 5,
      ordering: 5,
    },
    {
      id: "plant_fruit",
      label: "cây kết quả",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "cây trưởng thành",
        color: "red",
        shape: "circle",
        size: "large",
      },
      contrast_group: "late_stage",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "plant_seed",
      target_id: "plant_water",
      explanation: "gieo hạt giống rồi tưới nước mát",
    },
    {
      type: "sequence",
      source_id: "plant_water",
      target_id: "plant_sprout",
      explanation: "tưới nước rồi hạt nảy mầm",
    },
    {
      type: "sequence",
      source_id: "plant_sprout",
      target_id: "plant_leaf",
      explanation: "hạt nảy mầm rồi cây ra lá",
    },
    {
      type: "sequence",
      source_id: "plant_leaf",
      target_id: "plant_flower",
      explanation: "cây ra lá rồi cây nở hoa",
    },
    {
      type: "sequence",
      source_id: "plant_flower",
      target_id: "plant_fruit",
      explanation: "cây nở hoa rồi cây kết quả",
    },
  ],
  axes: {
    type: ["mầm cây non", "cây trưởng thành"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với chuỗi số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng chuỗi số",
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
    narration_template: "Chúng mình cùng sắp xếp chuỗi phát triển của cây nhé",
  },
  ordering: [
    "plant_seed",
    "plant_water",
    "plant_sprout",
    "plant_leaf",
    "plant_flower",
    "plant_fruit",
  ],
};

export const C3_SEQ_02_SEED: SkillSeed = {
  identity: C3_SEQ_02_IDENTITY,
  dataset: C3_SEQ_02_DATASET,
  levels: [
    {
      code: "GL-C3-SEQ-SLOT-0004",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-SLOT-0005",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C3-SEQ-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
