import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_OBS_02_IDENTITY: SkillIdentity = {
  code: "C4.OBS.02",
  strand_code: "C4.OBS",
  competency_code: "C4",
  name: "So hai vật cùng loại",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: ["C4.OBS.01", "C4.SEN.02"],
  learning_objectives: [
    {
      code: "LO-C4.OBS.02-01",
      behaviour: "Nhận biết và thực hành So hai vật cùng loại ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.OBS.02-02",
      behaviour: "Vận dụng So hai vật cùng loại trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.OBS.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới So hai vật cùng loại",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_OBS_02_DATASET: SkillDataset = {
  skill_code: "C4.OBS.02",
  concept_label: "So hai vật cùng loại",
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
      description: "Làm quen cơ bản với So hai vật cùng loại",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng So hai vật cùng loại",
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
    narration_template: "Chúng mình cùng tìm hiểu về So hai vật cùng loại nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C4_OBS_02_SEED: SkillSeed = {
  identity: C4_OBS_02_IDENTITY,
  dataset: C4_OBS_02_DATASET,
  levels: [
    {
      code: "GL-C4-OBS-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-PATT-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-PATT-0004",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
  ],
};
