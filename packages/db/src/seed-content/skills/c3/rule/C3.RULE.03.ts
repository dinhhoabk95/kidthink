import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_RULE_03_IDENTITY: SkillIdentity = {
  code: "C3.RULE.03",
  strand_code: "C3.RULE",
  competency_code: "C3",
  name: "Phát hiện quy luật sai",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["verify", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.RULE.01"],
  learning_objectives: [
    {
      code: "LO-C3.RULE.03-01",
      behaviour: "Nhận biết và thực hành Phát hiện quy luật sai ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.RULE.03-02",
      behaviour: "Vận dụng Phát hiện quy luật sai trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.RULE.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phát hiện quy luật sai",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_RULE_03_DATASET: SkillDataset = {
  skill_code: "C3.RULE.03",
  concept_label: "Phát hiện quy luật sai",
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
      description: "Làm quen cơ bản với Phát hiện quy luật sai",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phát hiện quy luật sai",
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
      "Chúng mình cùng tìm hiểu về Phát hiện quy luật sai nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C3_RULE_03_SEED: SkillSeed = {
  identity: C3_RULE_03_IDENTITY,
  dataset: C3_RULE_03_DATASET,
  levels: [
    {
      template: "GT-028",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-029",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
