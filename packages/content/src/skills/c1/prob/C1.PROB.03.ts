import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PROB_03_IDENTITY: SkillIdentity = {
  code: "C1.PROB.03",
  strand_code: "C1.PROB",
  competency_code: "C1",
  name: "Chia đều",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["solve"],
  tier: "advanced",
  prerequisites: ["C1.CNT.01", "C1.OTO.01"],
  learning_objectives: [
    {
      code: "LO-C1.PROB.03-01",
      behaviour: "Nhận biết và thực hành Chia đều ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PROB.03-02",
      behaviour: "Vận dụng Chia đều trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PROB.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chia đều",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PROB_03_DATASET: SkillDataset = {
  skill_code: "C1.PROB.03",
  concept_label: "Chia đều",
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
      description: "Làm quen cơ bản với Chia đều",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chia đều",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chia đều nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C1_PROB_03_SEED: SkillSeed = {
  identity: C1_PROB_03_IDENTITY,
  dataset: C1_PROB_03_DATASET,
  levels: [
    {
      code: "GL-C1-PROB-PICT-0005",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PICT-0006",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PICT-0007",
      template: "GT-031",
      band: "5-6",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PICT-0008",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PICT-0009",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TAP-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TAP-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TAP-0003",
      template: "GT-001",
      band: "4-5",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TAP-0004",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0001",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0002",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0003",
      template: "GT-003",
      band: "4-5",
      difficulty: 5,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TCMP-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PATT-0001",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PATT-0002",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PATT-0003",
      template: "GT-005",
      band: "4-5",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PATT-0004",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PATT-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
