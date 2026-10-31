import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_WM_02_IDENTITY: SkillIdentity = {
  code: "C6.WM.02",
  strand_code: "C6.WM",
  competency_code: "C6",
  name: "Nhớ và thực hiện 3 bước",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["recall", "plan"],
  tier: "advanced",
  prerequisites: ["C6.WM.01"],
  learning_objectives: [
    {
      code: "LO-C6.WM.02-01",
      behaviour: "Nhận biết và thực hành Nhớ và thực hiện 3 bước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.WM.02-02",
      behaviour: "Vận dụng Nhớ và thực hiện 3 bước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.WM.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhớ và thực hiện 3 bước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_WM_02_DATASET: SkillDataset = {
  skill_code: "C6.WM.02",
  concept_label: "Nhớ và thực hiện 3 bước",
  surface: "game",
  items: [
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả",
        color: "red",
        shape: "triangle",
      },
      value: 1,
      ordering: 1,
      contrast_group: "fruits",
    },
    {
      id: "grapes",
      label: "chùm nho",
      image: {
        kind: "emoji",
        ref: "🍇",
      },
      category: {
        type: "hoa quả",
        color: "blue",
        shape: "circle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "fruits",
    },
    {
      id: "cherry",
      label: "anh đào",
      image: {
        kind: "emoji",
        ref: "🍒",
      },
      category: {
        type: "hoa quả",
        color: "red",
        shape: "circle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "fruits",
    },
    {
      id: "strawberry",
      label: "dâu tây",
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "hoa quả",
        color: "red",
        shape: "triangle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "fruits",
    },
    {
      id: "sheep",
      label: "con cừu",
      image: {
        kind: "emoji",
        ref: "🐑",
      },
      category: {
        type: "vật nuôi",
        color: "white",
        shape: "circle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "pets",
    },
    {
      id: "dog",
      label: "con chó",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "vật nuôi",
        color: "yellow",
        shape: "circle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "pets",
    },
    {
      id: "chicken",
      label: "con gà",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "vật nuôi",
        color: "red",
        shape: "triangle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "pets",
    },
    {
      id: "rabbit",
      label: "con thỏ",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "vật nuôi",
        color: "white",
        shape: "circle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "pets",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhớ và thực hiện 3 bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ và thực hiện 3 bước",
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
    narration_template: "Chúng mình cùng ghi nhớ và thực hiện 3 bước nhé",
  },
  axes: {
    type: ["hoa quả", "vật nuôi"],
    step: {
      values: ["bước 1", "bước 2", "bước 3"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "watermelon",
      target_id: "grapes",
      type: "pair",
    },
    {
      source_id: "cherry",
      target_id: "strawberry",
      type: "pair",
    },
    {
      source_id: "sheep",
      target_id: "dog",
      type: "pair",
    },
    {
      source_id: "chicken",
      target_id: "rabbit",
      type: "pair",
    },
  ],
  ordering: [
    "watermelon",
    "grapes",
    "cherry",
    "strawberry",
    "sheep",
    "dog",
    "chicken",
    "rabbit",
  ],
};

export const C6_WM_02_SEED: SkillSeed = {
  identity: C6_WM_02_IDENTITY,
  dataset: C6_WM_02_DATASET,
  levels: [
    {
      code: "GL-C1-DOT-PAIR-0004",
      template: "GT-005",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-PAIR-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-GRD-0004",
      template: "GT-020",
      band: "4-5",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-GRD-0005",
      template: "GT-020",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
