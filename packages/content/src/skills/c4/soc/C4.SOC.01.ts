import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SOC_01_IDENTITY: SkillIdentity = {
  code: "C4.SOC.01",
  strand_code: "C4.SOC",
  competency_code: "C4",
  name: "Tên · tuổi · sở thích của mình",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["recall", "describe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.SOC.01-01",
      behaviour:
        "Nhận biết và thực hành Tên · tuổi · sở thích của mình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SOC.01-02",
      behaviour:
        "Vận dụng Tên · tuổi · sở thích của mình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SOC.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tên · tuổi · sở thích của mình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SOC_01_DATASET: SkillDataset = {
  skill_code: "C4.SOC.01",
  concept_label: "Tên · tuổi · sở thích của mình",
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
      description: "Làm quen cơ bản với Tên · tuổi · sở thích của mình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tên · tuổi · sở thích của mình",
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
      "Chúng mình cùng tìm hiểu về Tên · tuổi · sở thích của mình nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C4_SOC_01_SEED: SkillSeed = {
  identity: C4_SOC_01_IDENTITY,
  dataset: C4_SOC_01_DATASET,
  levels: [
    {
      code: "GL-C4-SOC-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PATT-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PATT-0004",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-MEMO-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-GRID-0002",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-GRID-0003",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
  ],
};
