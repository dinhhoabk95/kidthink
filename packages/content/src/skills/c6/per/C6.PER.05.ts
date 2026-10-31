import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PER_05_IDENTITY: SkillIdentity = {
  code: "C6.PER.05",
  strand_code: "C6.PER",
  competency_code: "C6",
  name: "Chịu chờ kết quả",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["inhibit", "predict"],
  tier: "advanced",
  prerequisites: ["C6.PER.03"],
  learning_objectives: [
    {
      code: "LO-C6.PER.05-01",
      behaviour: "Nhận biết và thực hành Chịu chờ kết quả ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PER.05-02",
      behaviour: "Vận dụng Chịu chờ kết quả trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PER.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chịu chờ kết quả",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PER_05_DATASET: SkillDataset = {
  skill_code: "C6.PER.05",
  concept_label: "Kiên nhẫn chờ kết quả",
  surface: "game",
  items: [
    {
      id: "notebook",
      label: "quyển vở",
      image: {
        kind: "emoji",
        ref: "📓",
      },
      category: {
        type: "đồ học tập",
        color: "blue",
        shape: "square",
      },
      value: 1,
      ordering: 1,
      contrast_group: "study_tools",
    },
    {
      id: "pencil",
      label: "bút chì",
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "đồ học tập",
        color: "yellow",
        shape: "triangle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "study_tools",
    },
    {
      id: "backpack",
      label: "cặp sách",
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "đồ học tập",
        color: "red",
        shape: "square",
      },
      value: 3,
      ordering: 3,
      contrast_group: "study_tools",
    },
    {
      id: "ruler",
      label: "thước kẻ",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "đồ học tập",
        color: "green",
        shape: "square",
      },
      value: 4,
      ordering: 4,
      contrast_group: "study_tools",
    },
    {
      id: "onion",
      label: "hành tây",
      image: {
        kind: "emoji",
        ref: "🧅",
      },
      category: {
        type: "rau củ",
        color: "yellow",
        shape: "circle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "vegetables",
    },
    {
      id: "tomato",
      label: "cà chua",
      image: {
        kind: "emoji",
        ref: "🍅",
      },
      category: {
        type: "rau củ",
        color: "red",
        shape: "circle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "vegetables",
    },
    {
      id: "broccoli",
      label: "súp lơ",
      image: {
        kind: "emoji",
        ref: "🥦",
      },
      category: {
        type: "rau củ",
        color: "green",
        shape: "triangle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "vegetables",
    },
    {
      id: "carrot",
      label: "cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
        color: "red",
        shape: "triangle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "vegetables",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chịu chờ kết quả",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chịu chờ kết quả",
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
    narration_template: "Chúng mình cùng kiên nhẫn chờ kết quả nhé",
  },
  axes: {
    type: ["đồ học tập", "rau củ"],
    wait_time: {
      values: [
        "chờ một chút",
        "kiên nhẫn",
        "sắp có kết quả",
        "nhận phần thưởng",
      ],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "notebook",
      target_id: "pencil",
      type: "pair",
    },
    {
      source_id: "backpack",
      target_id: "ruler",
      type: "pair",
    },
    {
      source_id: "onion",
      target_id: "tomato",
      type: "pair",
    },
    {
      source_id: "broccoli",
      target_id: "carrot",
      type: "pair",
    },
  ],
  ordering: [
    "notebook",
    "pencil",
    "backpack",
    "ruler",
    "onion",
    "tomato",
    "broccoli",
    "carrot",
  ],
};

export const C6_PER_05_SEED: SkillSeed = {
  identity: C6_PER_05_IDENTITY,
  dataset: C6_PER_05_DATASET,
  levels: [
    {
      code: "GL-C6-PER-DOTS-0001",
      template: "GT-011",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-DIFF-0001",
      template: "GT-014",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-ISO-0001",
      template: "GT-017",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-HUNT-0012",
      template: "GT-037",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
