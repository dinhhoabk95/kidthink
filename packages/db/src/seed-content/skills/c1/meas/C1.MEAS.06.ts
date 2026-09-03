import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_06_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.06",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Thể tích trực quan",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["compare", "infer"],
  tier: "advanced",
  prerequisites: ["C1.MEAS.05"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.06-01",
      behaviour: "Nhận biết và thực hành Thể tích trực quan ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.06-02",
      behaviour: "Vận dụng Thể tích trực quan trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thể tích trực quan",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_06_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.06",
  concept_label: "Thể tích trực quan",
  surface: "game",
  items: [
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
    {
      id: "fish",
      label: "con cá",
      image: {
        kind: "emoji",
        ref: "🐟",
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
      description: "Làm quen cơ bản với Thể tích trực quan",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thể tích trực quan",
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
    narration_template: "Chúng mình cùng tìm hiểu về Thể tích trực quan nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C1_MEAS_06_SEED: SkillSeed = {
  identity: C1_MEAS_06_IDENTITY,
  dataset: C1_MEAS_06_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
