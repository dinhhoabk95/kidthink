import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_RULE_02_IDENTITY: SkillIdentity = {
  code: "C3.RULE.02",
  strand_code: "C3.RULE",
  competency_code: "C3",
  name: "Hoàn thành quy luật",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["predict", "create"],
  tier: "core",
  prerequisites: ["C3.RULE.01"],
  learning_objectives: [
    {
      code: "LO-C3.RULE.02-01",
      behaviour: "Nhận biết và thực hành Hoàn thành quy luật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.RULE.02-02",
      behaviour: "Vận dụng Hoàn thành quy luật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.RULE.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Hoàn thành quy luật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_RULE_02_DATASET: SkillDataset = {
  skill_code: "C3.RULE.02",
  concept_label: "Hoàn thành quy luật",
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
      description: "Làm quen cơ bản với Hoàn thành quy luật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hoàn thành quy luật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hoàn thành quy luật nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C3_RULE_02_SEED: SkillSeed = {
  identity: C3_RULE_02_IDENTITY,
  dataset: C3_RULE_02_DATASET,
  levels: [
    {
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-019",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
