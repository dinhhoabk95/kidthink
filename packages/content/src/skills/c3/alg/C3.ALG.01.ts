import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_01_IDENTITY: SkillIdentity = {
  code: "C3.ALG.01",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Làm theo hai bước",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sequence", "plan"],
  tier: "basic",
  prerequisites: ["C5.LIS.02"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.01-01",
      behaviour: "Nhận biết và thực hành Làm theo chuỗi 2 lệnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.01-02",
      behaviour: "Vận dụng Làm theo chuỗi 2 lệnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Làm theo chuỗi 2 lệnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_01_DATASET: SkillDataset = {
  skill_code: "C3.ALG.01",
  concept_label: "Làm theo hai bước",
  surface: "game",
  items: [
    {
      id: "soap",
      label: "lấy xà phòng",
      image: {
        kind: "emoji",
        ref: "🧼",
      },
      category: {
        type: "vệ sinh tay",
        color: "blue",
        shape: "square",
        size: "small",
      },
      contrast_group: "morning_wash",
      value: 1,
      ordering: 1,
    },
    {
      id: "water_tap",
      label: "rửa sạch tay",
      image: {
        kind: "emoji",
        ref: "🚰",
      },
      category: {
        type: "vệ sinh tay",
        color: "blue",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "morning_wash",
      value: 2,
      ordering: 2,
    },
    {
      id: "toothbrush",
      label: "lấy bàn chải",
      image: {
        kind: "emoji",
        ref: "🪥",
      },
      category: {
        type: "vệ sinh tay",
        color: "green",
        shape: "rectangle",
        size: "small",
      },
      contrast_group: "morning_wash",
      value: 3,
      ordering: 3,
    },
    {
      id: "clean_teeth",
      label: "đánh răng sạch",
      image: {
        kind: "emoji",
        ref: "😁",
      },
      category: {
        type: "vệ sinh tay",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "morning_wash",
      value: 4,
      ordering: 4,
    },
    {
      id: "shirt",
      label: "mặc áo mới",
      image: {
        kind: "emoji",
        ref: "👕",
      },
      category: {
        type: "đồ mặc đi",
        color: "blue",
        shape: "square",
        size: "medium",
      },
      contrast_group: "morning_dress",
      value: 5,
      ordering: 5,
    },
    {
      id: "shoes",
      label: "xỏ đôi giày",
      image: {
        kind: "emoji",
        ref: "👟",
      },
      category: {
        type: "đồ mặc đi",
        color: "red",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "morning_dress",
      value: 6,
      ordering: 6,
    },
    {
      id: "hat",
      label: "đội mũ xinh",
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      category: {
        type: "đồ mặc đi",
        color: "blue",
        shape: "circle",
        size: "small",
      },
      contrast_group: "morning_dress",
      value: 7,
      ordering: 7,
    },
    {
      id: "backpack",
      label: "đeo cặp sách",
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "đồ mặc đi",
        color: "red",
        shape: "square",
        size: "large",
      },
      contrast_group: "morning_dress",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "soap",
      target_id: "water_tap",
      explanation: "lấy xà phòng rồi rửa sạch tay",
    },
    {
      type: "sequence",
      source_id: "toothbrush",
      target_id: "clean_teeth",
      explanation: "lấy bàn chải rồi đánh răng sạch",
    },
    {
      type: "sequence",
      source_id: "shirt",
      target_id: "shoes",
      explanation: "mặc áo mới rồi xỏ đôi giày",
    },
    {
      type: "sequence",
      source_id: "hat",
      target_id: "backpack",
      explanation: "đội mũ xinh rồi đeo cặp sách",
    },
  ],
  axes: {
    type: ["vệ sinh tay", "đồ mặc đi"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với làm theo hai bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng làm theo hai bước",
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
    narration_template: "Chúng mình cùng làm lần lượt theo hai bước nhé",
  },
  ordering: [
    "soap",
    "water_tap",
    "toothbrush",
    "clean_teeth",
    "shirt",
    "shoes",
    "hat",
    "backpack",
  ],
};

export const C3_ALG_01_SEED: SkillSeed = {
  identity: C3_ALG_01_IDENTITY,
  dataset: C3_ALG_01_DATASET,
  levels: [
    {
      code: "GL-C3-ALG-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-BOND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
  ],
};
