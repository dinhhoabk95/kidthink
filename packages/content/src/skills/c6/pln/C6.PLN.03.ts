import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PLN_03_IDENTITY: SkillIdentity = {
  code: "C6.PLN.03",
  strand_code: "C6.PLN",
  competency_code: "C6",
  name: "Thử trong đầu trước khi thao tác",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["plan", "predict"],
  tier: "advanced",
  prerequisites: ["C6.PLN.01"],
  learning_objectives: [
    {
      code: "LO-C6.PLN.03-01",
      behaviour:
        "Nhận biết và thực hành Thử trong đầu trước khi thao tác ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PLN.03-02",
      behaviour:
        "Vận dụng Thử trong đầu trước khi thao tác trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PLN.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thử trong đầu trước khi thao tác",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PLN_03_DATASET: SkillDataset = {
  skill_code: "C6.PLN.03",
  concept_label: "Thử trong đầu trước khi thao tác",
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
    {
      id: "dog",
      label: "con chó",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "cat",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "động vật",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Thử trong đầu trước khi thao tác",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thử trong đầu trước khi thao tác",
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
      "Chúng mình cùng tìm hiểu về Thử trong đầu trước khi thao tác nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C6_PLN_03_SEED: SkillSeed = {
  identity: C6_PLN_03_IDENTITY,
  dataset: C6_PLN_03_DATASET,
  levels: [
    {
      code: "GL-C6-PLN-FIN-0001",
      template: "GT-024",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-FIN-0002",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
