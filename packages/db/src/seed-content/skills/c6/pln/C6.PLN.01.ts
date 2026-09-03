import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PLN_01_IDENTITY: SkillIdentity = {
  code: "C6.PLN.01",
  strand_code: "C6.PLN",
  competency_code: "C6",
  name: "Lập kế hoạch trước khi làm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan"],
  tier: "advanced",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C6.PLN.01-01",
      behaviour:
        "Nhận biết và thực hành Lập kế hoạch trước khi làm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PLN.01-02",
      behaviour:
        "Vận dụng Lập kế hoạch trước khi làm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PLN.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Lập kế hoạch trước khi làm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PLN_01_DATASET: SkillDataset = {
  skill_code: "C6.PLN.01",
  concept_label: "Lập kế hoạch trước khi làm",
  surface: "game",
  items: [
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
    {
      id: "corn",
      label: "bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
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
      description: "Làm quen cơ bản với Lập kế hoạch trước khi làm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Lập kế hoạch trước khi làm",
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
      "Chúng mình cùng tìm hiểu về Lập kế hoạch trước khi làm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C6_PLN_01_SEED: SkillSeed = {
  identity: C6_PLN_01_IDENTITY,
  dataset: C6_PLN_01_DATASET,
  levels: [
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
