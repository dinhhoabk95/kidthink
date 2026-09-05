import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SET_06_IDENTITY: SkillIdentity = {
  code: "C3.SET.06",
  strand_code: "C3.SET",
  competency_code: "C3",
  name: "Không phải … cũng không …",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["deduce", "inhibit"],
  tier: "advanced",
  prerequisites: ["C3.SET.05", "C3.DED.02"],
  learning_objectives: [
    {
      code: "LO-C3.SET.06-01",
      behaviour:
        "Nhận biết và thực hành Không phải … cũng không … ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SET.06-02",
      behaviour:
        "Vận dụng Không phải … cũng không … trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SET.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Không phải … cũng không …",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SET_06_DATASET: SkillDataset = {
  skill_code: "C3.SET.06",
  concept_label: "Không phải … cũng không …",
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
      description: "Làm quen cơ bản với Không phải … cũng không …",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Không phải … cũng không …",
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
      "Chúng mình cùng tìm hiểu về Không phải … cũng không … nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C3_SET_06_SEED: SkillSeed = {
  identity: C3_SET_06_IDENTITY,
  dataset: C3_SET_06_DATASET,
  levels: [
    {
      code: "GL-C3-SET-BOND-0001",
      template: "GT-018",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-BOND-0002",
      template: "GT-018",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SYMM-0001",
      template: "GT-022",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SYMM-0002",
      template: "GT-022",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-STIK-0001",
      template: "GT-025",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-STIK-0002",
      template: "GT-025",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-ADD-0001",
      template: "GT-026",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-ADD-0002",
      template: "GT-026",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SUB-0001",
      template: "GT-027",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C3-SET-SUB-0002",
      template: "GT-027",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
