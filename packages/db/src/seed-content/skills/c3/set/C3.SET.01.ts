import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SET_01_IDENTITY: SkillIdentity = {
  code: "C3.SET.01",
  strand_code: "C3.SET",
  competency_code: "C3",
  name: "Thuộc / không thuộc nhóm",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["sort", "deduce"],
  tier: "basic",
  prerequisites: ["C3.CLS.01"],
  learning_objectives: [
    {
      code: "LO-C3.SET.01-01",
      behaviour: "Nhận biết và thực hành Thuộc / không thuộc nhóm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SET.01-02",
      behaviour: "Vận dụng Thuộc / không thuộc nhóm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SET.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thuộc / không thuộc nhóm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SET_01_DATASET: SkillDataset = {
  skill_code: "C3.SET.01",
  concept_label: "Thuộc / không thuộc nhóm",
  surface: "game",
  items: [
    {
      id: "chair",
      label: "cái ghế",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "apple",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "banana",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Thuộc / không thuộc nhóm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thuộc / không thuộc nhóm",
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
      "Chúng mình cùng tìm hiểu về Thuộc / không thuộc nhóm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C3_SET_01_SEED: SkillSeed = {
  identity: C3_SET_01_IDENTITY,
  dataset: C3_SET_01_DATASET,
  levels: [
    {
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
