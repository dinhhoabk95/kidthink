import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_05_IDENTITY: SkillIdentity = {
  code: "C3.ALG.05",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Tìm bước sai trong chuỗi",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["verify", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.ALG.03", "C3.RULE.03"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.05-01",
      behaviour: "Nhận biết và thực hành Tìm bước sai trong chuỗi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.05-02",
      behaviour: "Vận dụng Tìm bước sai trong chuỗi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm bước sai trong chuỗi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_05_DATASET: SkillDataset = {
  skill_code: "C3.ALG.05",
  concept_label: "Tìm bước sai trong chuỗi",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm bước sai trong chuỗi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm bước sai trong chuỗi",
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
      "Chúng mình cùng tìm hiểu về Tìm bước sai trong chuỗi nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C3_ALG_05_SEED: SkillSeed = {
  identity: C3_ALG_05_IDENTITY,
  dataset: C3_ALG_05_DATASET,
  levels: [
    {
      code: "GL-C3-ALG-MEAS-0001",
      template: "GT-028",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-MEAS-0002",
      template: "GT-028",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-TIME-0001",
      template: "GT-029",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-TIME-0002",
      template: "GT-029",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-COIN-0001",
      template: "GT-030",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-COIN-0002",
      template: "GT-030",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-PICT-0002",
      template: "GT-031",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-VENN-0001",
      template: "GT-032",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-VENN-0002",
      template: "GT-032",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
  ],
};
