import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_CLS_05_IDENTITY: SkillIdentity = {
  code: "C3.CLS.05",
  strand_code: "C3.CLS",
  competency_code: "C3",
  name: "Phân loại theo số lượng",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sort", "count"],
  tier: "core",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C3.CLS.05-01",
      behaviour: "Nhận biết và thực hành Phân loại theo số lượng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.CLS.05-02",
      behaviour: "Vận dụng Phân loại theo số lượng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.CLS.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân loại theo số lượng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_CLS_05_DATASET: SkillDataset = {
  skill_code: "C3.CLS.05",
  concept_label: "Phân loại theo số lượng",
  surface: "game",
  items: [
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
    {
      id: "chicken",
      label: "con gà",
      image: {
        kind: "emoji",
        ref: "🐓",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "duck",
      label: "con vịt",
      image: {
        kind: "emoji",
        ref: "🦆",
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
      description: "Làm quen cơ bản với Phân loại theo số lượng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân loại theo số lượng",
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
      "Chúng mình cùng tìm hiểu về Phân loại theo số lượng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C3_CLS_05_SEED: SkillSeed = {
  identity: C3_CLS_05_IDENTITY,
  dataset: C3_CLS_05_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
