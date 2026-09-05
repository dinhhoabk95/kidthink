import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INI_03_IDENTITY: SkillIdentity = {
  code: "C6.INI.03",
  strand_code: "C6.INI",
  competency_code: "C6",
  name: "Nhận ra khi cần giúp",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["verify", "describe"],
  tier: "advanced",
  prerequisites: ["C6.MON.01"],
  learning_objectives: [
    {
      code: "LO-C6.INI.03-01",
      behaviour: "Nhận biết và thực hành Nhận ra khi cần giúp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INI.03-02",
      behaviour: "Vận dụng Nhận ra khi cần giúp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INI.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhận ra khi cần giúp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INI_03_DATASET: SkillDataset = {
  skill_code: "C6.INI.03",
  concept_label: "Nhận ra khi cần giúp",
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
      description: "Làm quen cơ bản với Nhận ra khi cần giúp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận ra khi cần giúp",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhận ra khi cần giúp nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C6_INI_03_SEED: SkillSeed = {
  identity: C6_INI_03_IDENTITY,
  dataset: C6_INI_03_DATASET,
  levels: [
    {
      code: "GL-C6-INI-MEAS-0001",
      template: "GT-028",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-MEAS-0002",
      template: "GT-028",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-TIME-0001",
      template: "GT-029",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-TIME-0002",
      template: "GT-029",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-COIN-0001",
      template: "GT-030",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-COIN-0002",
      template: "GT-030",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-PICT-0002",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-VENN-0001",
      template: "GT-032",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-VENN-0002",
      template: "GT-032",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
