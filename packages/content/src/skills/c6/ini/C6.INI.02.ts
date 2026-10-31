import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INI_02_IDENTITY: SkillIdentity = {
  code: "C6.INI.02",
  strand_code: "C6.INI",
  competency_code: "C6",
  name: "Nói ý định trước khi làm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "describe"],
  tier: "advanced",
  prerequisites: ["C6.INI.01", "C6.PLN.01"],
  learning_objectives: [
    {
      code: "LO-C6.INI.02-01",
      behaviour: "Nhận biết và thực hành Nói ý định trước khi làm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INI.02-02",
      behaviour: "Vận dụng Nói ý định trước khi làm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INI.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nói ý định trước khi làm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INI_02_DATASET: SkillDataset = {
  skill_code: "C6.INI.02",
  concept_label: "Nói ý định trước khi làm",
  surface: "game",
  items: [
    {
      id: "firetruck",
      label: "xe cứu hỏa",
      image: {
        kind: "emoji",
        ref: "🚒",
      },
      category: {
        type: "xe cộ",
        color: "red",
        shape: "square",
      },
      value: 1,
      ordering: 1,
      contrast_group: "vehicles",
    },
    {
      id: "bus",
      label: "xe buýt",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "xe cộ",
        color: "yellow",
        shape: "square",
      },
      value: 2,
      ordering: 2,
      contrast_group: "vehicles",
    },
    {
      id: "airplane",
      label: "máy bay",
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "xe cộ",
        color: "blue",
        shape: "triangle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "vehicles",
    },
    {
      id: "train",
      label: "tàu hoả",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "xe cộ",
        color: "green",
        shape: "square",
      },
      value: 4,
      ordering: 4,
      contrast_group: "vehicles",
    },
    {
      id: "scissors",
      label: "cái kéo",
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "đồ học tập",
        color: "red",
        shape: "triangle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "study_tools",
    },
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
      value: 6,
      ordering: 6,
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
      value: 7,
      ordering: 7,
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
      value: 8,
      ordering: 8,
      contrast_group: "study_tools",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nói ý định trước khi làm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nói ý định trước khi làm",
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
    narration_template: "Chúng mình cùng nêu ý định trước khi làm nhé",
  },
  axes: {
    type: ["xe cộ", "đồ học tập"],
    step: {
      values: ["chuẩn bị", "thực hiện", "hoàn thành", "đánh giá"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "firetruck",
      target_id: "bus",
      type: "pair",
    },
    {
      source_id: "airplane",
      target_id: "train",
      type: "pair",
    },
    {
      source_id: "scissors",
      target_id: "notebook",
      type: "pair",
    },
    {
      source_id: "pencil",
      target_id: "ruler",
      type: "pair",
    },
  ],
  ordering: [
    "firetruck",
    "bus",
    "airplane",
    "train",
    "scissors",
    "notebook",
    "pencil",
    "ruler",
  ],
};

export const C6_INI_02_SEED: SkillSeed = {
  identity: C6_INI_02_IDENTITY,
  dataset: C6_INI_02_DATASET,
  levels: [
    {
      code: "GL-C6-INI-SHAD-0006",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
  ],
};
