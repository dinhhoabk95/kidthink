import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ORD_05_IDENTITY: SkillIdentity = {
  code: "C1.ORD.05",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Đếm tiếp từ vị trí bất kỳ",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["count", "infer"],
  tier: "core",
  prerequisites: ["C1.ORD.04"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.05-01",
      behaviour:
        "Nhận biết và thực hành Đếm tiếp từ vị trí bất kỳ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.05-02",
      behaviour:
        "Vận dụng Đếm tiếp từ vị trí bất kỳ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đếm tiếp từ vị trí bất kỳ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_05_DATASET: SkillDataset = {
  skill_code: "C1.ORD.05",
  concept_label: "Đếm tiếp từ vị trí bất kỳ",
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
      description: "Làm quen cơ bản với Đếm tiếp từ vị trí bất kỳ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đếm tiếp từ vị trí bất kỳ",
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
      "Chúng mình cùng tìm hiểu về Đếm tiếp từ vị trí bất kỳ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C1_ORD_05_SEED: SkillSeed = {
  identity: C1_ORD_05_IDENTITY,
  dataset: C1_ORD_05_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
