import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_OTO_03_IDENTITY: SkillIdentity = {
  code: "C1.OTO.03",
  strand_code: "C1.OTO",
  competency_code: "C1",
  name: "Ghép đồ vật với bóng",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match", "observe"],
  tier: "basic",
  prerequisites: ["C1.OTO.01"],
  learning_objectives: [
    {
      code: "LO-C1.OTO.03-01",
      behaviour: "Nhận biết và thực hành Ghép đồ vật với bóng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.OTO.03-02",
      behaviour: "Vận dụng Ghép đồ vật với bóng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.OTO.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Ghép đồ vật với bóng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_OTO_03_DATASET: SkillDataset = {
  skill_code: "C1.OTO.03",
  concept_label: "Ghép đồ vật với bóng",
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
      description: "Làm quen cơ bản với Ghép đồ vật với bóng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghép đồ vật với bóng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ghép đồ vật với bóng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C1_OTO_03_SEED: SkillSeed = {
  identity: C1_OTO_03_IDENTITY,
  dataset: C1_OTO_03_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
