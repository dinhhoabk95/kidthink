import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TOO_05_IDENTITY: SkillIdentity = {
  code: "C4.TOO.05",
  strand_code: "C4.TOO",
  competency_code: "C4",
  name: "Dùng thiết bị số an toàn",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["plan", "inhibit"],
  tier: "core",
  prerequisites: ["C4.TOO.01"],
  learning_objectives: [
    {
      code: "LO-C4.TOO.05-01",
      behaviour: "Nhận biết và thực hành Dùng thiết bị số an toàn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TOO.05-02",
      behaviour: "Vận dụng Dùng thiết bị số an toàn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TOO.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Dùng thiết bị số an toàn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TOO_05_DATASET: SkillDataset = {
  skill_code: "C4.TOO.05",
  concept_label: "Dùng thiết bị số an toàn",
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
      description: "Làm quen cơ bản với Dùng thiết bị số an toàn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dùng thiết bị số an toàn",
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
      "Chúng mình cùng tìm hiểu về Dùng thiết bị số an toàn nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C4_TOO_05_SEED: SkillSeed = {
  identity: C4_TOO_05_IDENTITY,
  dataset: C4_TOO_05_DATASET,
  levels: [
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-007",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
