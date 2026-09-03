import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SET_05_IDENTITY: SkillIdentity = {
  code: "C3.SET.05",
  strand_code: "C3.SET",
  competency_code: "C3",
  name: "Vừa … vừa …",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["deduce", "sort"],
  tier: "advanced",
  prerequisites: ["C3.SET.04"],
  learning_objectives: [
    {
      code: "LO-C3.SET.05-01",
      behaviour: "Nhận biết và thực hành Vừa … vừa … ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SET.05-02",
      behaviour: "Vận dụng Vừa … vừa … trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SET.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Vừa … vừa …",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SET_05_DATASET: SkillDataset = {
  skill_code: "C3.SET.05",
  concept_label: "Vừa … vừa …",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vừa … vừa …",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vừa … vừa …",
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
    narration_template: "Chúng mình cùng tìm hiểu về Vừa … vừa … nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C3_SET_05_SEED: SkillSeed = {
  identity: C3_SET_05_IDENTITY,
  dataset: C3_SET_05_DATASET,
  levels: [
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
