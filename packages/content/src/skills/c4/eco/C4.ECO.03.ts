import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_ECO_03_IDENTITY: SkillIdentity = {
  code: "C4.ECO.03",
  strand_code: "C4.ECO",
  competency_code: "C4",
  name: "Phân loại rác",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sort", "deduce"],
  tier: "advanced",
  prerequisites: ["C4.ECO.01", "C3.CLS.06"],
  learning_objectives: [
    {
      code: "LO-C4.ECO.03-01",
      behaviour: "Nhận biết và thực hành Phân loại rác ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.ECO.03-02",
      behaviour: "Vận dụng Phân loại rác trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.ECO.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Phân loại rác",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_ECO_03_DATASET: SkillDataset = {
  skill_code: "C4.ECO.03",
  concept_label: "Phân loại rác",
  surface: "game",
  items: [
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Phân loại rác",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân loại rác",
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
    narration_template: "Chúng mình cùng tìm hiểu về Phân loại rác nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C4_ECO_03_SEED: SkillSeed = {
  identity: C4_ECO_03_IDENTITY,
  dataset: C4_ECO_03_DATASET,
  levels: [
    {
      code: "GL-C4-ECO-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-TCMP-0003",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-TCMP-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SLOT-0002",
      template: "GT-008",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-HIDE-0002",
      template: "GT-015",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
  ],
};
