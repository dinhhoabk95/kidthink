import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SOC_02_IDENTITY: SkillIdentity = {
  code: "C4.SOC.02",
  strand_code: "C4.SOC",
  competency_code: "C4",
  name: "Thành viên trong gia đình",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match", "describe"],
  tier: "basic",
  prerequisites: ["C4.SOC.01"],
  learning_objectives: [
    {
      code: "LO-C4.SOC.02-01",
      behaviour:
        "Nhận biết và thực hành Thành viên trong gia đình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SOC.02-02",
      behaviour:
        "Vận dụng Thành viên trong gia đình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SOC.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thành viên trong gia đình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SOC_02_DATASET: SkillDataset = {
  skill_code: "C4.SOC.02",
  concept_label: "Thành viên trong gia đình",
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
      description: "Làm quen cơ bản với Thành viên trong gia đình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thành viên trong gia đình",
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
      "Chúng mình cùng tìm hiểu về Thành viên trong gia đình nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C4_SOC_02_SEED: SkillSeed = {
  identity: C4_SOC_02_IDENTITY,
  dataset: C4_SOC_02_DATASET,
  levels: [
    {
      code: "GL-C4-SOC-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-GRID-0004",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-GRID-0005",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
  ],
};
