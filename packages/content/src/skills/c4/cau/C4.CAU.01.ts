import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_CAU_01_IDENTITY: SkillIdentity = {
  code: "C4.CAU.01",
  strand_code: "C4.CAU",
  competency_code: "C4",
  name: "Điều gì xảy ra tiếp theo",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["predict", "infer"],
  tier: "core",
  prerequisites: ["C3.SEQ.03"],
  learning_objectives: [
    {
      code: "LO-C4.CAU.01-01",
      behaviour: "Nhận biết và thực hành Điều gì xảy ra tiếp theo ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.CAU.01-02",
      behaviour: "Vận dụng Điều gì xảy ra tiếp theo trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.CAU.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Điều gì xảy ra tiếp theo",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_CAU_01_DATASET: SkillDataset = {
  skill_code: "C4.CAU.01",
  concept_label: "Điều gì xảy ra tiếp theo",
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
      description: "Làm quen cơ bản với Điều gì xảy ra tiếp theo",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Điều gì xảy ra tiếp theo",
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
      "Chúng mình cùng tìm hiểu về Điều gì xảy ra tiếp theo nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C4_CAU_01_SEED: SkillSeed = {
  identity: C4_CAU_01_IDENTITY,
  dataset: C4_CAU_01_DATASET,
  levels: [
    {
      code: "GL-C4-CAU-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-CAU-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
  ],
};
