import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRA_02_IDENTITY: SkillIdentity = {
  code: "C5.PRA.02",
  strand_code: "C5.PRA",
  competency_code: "C5",
  name: "Chờ đến lượt nói",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "inhibit"],
  tier: "core",
  prerequisites: ["C5.LIS.01"],
  learning_objectives: [
    {
      code: "LO-C5.PRA.02-01",
      behaviour: "Nhận biết và thực hành Chờ đến lượt nói ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRA.02-02",
      behaviour: "Vận dụng Chờ đến lượt nói trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRA.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chờ đến lượt nói",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRA_02_DATASET: SkillDataset = {
  skill_code: "C5.PRA.02",
  concept_label: "Chờ đến lượt nói",
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
      description: "Làm quen cơ bản với Chờ đến lượt nói",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chờ đến lượt nói",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chờ đến lượt nói nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C5_PRA_02_SEED: SkillSeed = {
  identity: C5_PRA_02_IDENTITY,
  dataset: C5_PRA_02_DATASET,
  levels: [
    {
      code: "GL-C5-PRA-BOND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-BOND-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-BOND-0003",
      template: "GT-018",
      band: "4-5",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-SYMM-0001",
      template: "GT-022",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-SYMM-0002",
      template: "GT-022",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-SYMM-0003",
      template: "GT-022",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-STIK-0001",
      template: "GT-025",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-STIK-0002",
      template: "GT-025",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-ADD-0001",
      template: "GT-026",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-ADD-0002",
      template: "GT-026",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
  ],
};
