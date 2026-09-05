import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SAF_02_IDENTITY: SkillIdentity = {
  code: "C4.SAF.02",
  strand_code: "C4.SAF",
  competency_code: "C4",
  name: "Đèn giao thông",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "inhibit"],
  tier: "basic",
  prerequisites: ["C3.CLS.01"],
  learning_objectives: [
    {
      code: "LO-C4.SAF.02-01",
      behaviour: "Nhận biết và thực hành Đèn giao thông ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SAF.02-02",
      behaviour: "Vận dụng Đèn giao thông trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SAF.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đèn giao thông",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SAF_02_DATASET: SkillDataset = {
  skill_code: "C4.SAF.02",
  concept_label: "Đèn giao thông",
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
      description: "Làm quen cơ bản với Đèn giao thông",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đèn giao thông",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đèn giao thông nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C4_SAF_02_SEED: SkillSeed = {
  identity: C4_SAF_02_IDENTITY,
  dataset: C4_SAF_02_DATASET,
  levels: [
    {
      code: "GL-C4-SAF-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-PATT-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-PATT-0004",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
  ],
};
