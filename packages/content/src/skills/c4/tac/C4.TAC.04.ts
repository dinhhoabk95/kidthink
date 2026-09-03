import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TAC_04_IDENTITY: SkillIdentity = {
  code: "C4.TAC.04",
  strand_code: "C4.TAC",
  competency_code: "C4",
  name: "Nặng – nhẹ bằng tay",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["compare", "verify"],
  tier: "core",
  prerequisites: ["C1.CMP.10", "C1.CMP.11"],
  learning_objectives: [
    {
      code: "LO-C4.TAC.04-01",
      behaviour: "Nhận biết và thực hành Nặng – nhẹ bằng tay ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TAC.04-02",
      behaviour: "Vận dụng Nặng – nhẹ bằng tay trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TAC.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nặng – nhẹ bằng tay",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TAC_04_DATASET: SkillDataset = {
  skill_code: "C4.TAC.04",
  concept_label: "Nặng – nhẹ bằng tay",
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
      description: "Làm quen cơ bản với Nặng – nhẹ bằng tay",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nặng – nhẹ bằng tay",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nặng – nhẹ bằng tay nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C4_TAC_04_SEED: SkillSeed = {
  identity: C4_TAC_04_IDENTITY,
  dataset: C4_TAC_04_DATASET,
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
