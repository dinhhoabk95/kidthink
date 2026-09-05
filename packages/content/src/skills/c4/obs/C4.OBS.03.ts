import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_OBS_03_IDENTITY: SkillIdentity = {
  code: "C4.OBS.03",
  strand_code: "C4.OBS",
  competency_code: "C4",
  name: "Quan sát nhiều lần, thấy đổi thay",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "sequence"],
  tier: "core",
  prerequisites: ["C4.OBS.02"],
  learning_objectives: [
    {
      code: "LO-C4.OBS.03-01",
      behaviour:
        "Nhận biết và thực hành Quan sát nhiều lần, thấy đổi thay ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.OBS.03-02",
      behaviour:
        "Vận dụng Quan sát nhiều lần, thấy đổi thay trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.OBS.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Quan sát nhiều lần, thấy đổi thay",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_OBS_03_DATASET: SkillDataset = {
  skill_code: "C4.OBS.03",
  concept_label: "Quan sát nhiều lần, thấy đổi thay",
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
      description: "Làm quen cơ bản với Quan sát nhiều lần, thấy đổi thay",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Quan sát nhiều lần, thấy đổi thay",
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
      "Chúng mình cùng tìm hiểu về Quan sát nhiều lần, thấy đổi thay nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["dog", "cat", "chicken", "duck", "fish"],
};

export const C4_OBS_03_SEED: SkillSeed = {
  identity: C4_OBS_03_IDENTITY,
  dataset: C4_OBS_03_DATASET,
  levels: [
    {
      code: "GL-C4-OBS-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCMP-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCMP-0006",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-PATT-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-PATT-0006",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
