import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PROB_02_IDENTITY: SkillIdentity = {
  code: "C1.PROB.02",
  strand_code: "C1.PROB",
  competency_code: "C1",
  name: "Thử sai có hệ thống",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["verify", "solve"],
  tier: "advanced",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.PROB.02-01",
      behaviour: "Nhận biết và thực hành Thử sai có hệ thống ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PROB.02-02",
      behaviour: "Vận dụng Thử sai có hệ thống trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PROB.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thử sai có hệ thống",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PROB_02_DATASET: SkillDataset = {
  skill_code: "C1.PROB.02",
  concept_label: "Thử sai có hệ thống",
  surface: "game",
  items: [
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      contrast_group: "rau củ",
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
      contrast_group: "rau củ",
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
      contrast_group: "con vật",
      category: {
        type: "con vật",
      },
    },
    {
      id: "cat",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      contrast_group: "con vật",
      category: {
        type: "con vật",
      },
    },
    {
      id: "chicken",
      label: "con gà",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      contrast_group: "con vật",
      category: {
        type: "con vật",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "dog",
      target_id: "cat",
      metadata: {
        near_miss: true,
      },
    },
    {
      type: "contrast",
      source_id: "cat",
      target_id: "chicken",
      metadata: {
        near_miss: true,
      },
    },
    {
      type: "contrast",
      source_id: "carrot",
      target_id: "corn",
      metadata: {
        near_miss: true,
      },
    },
  ],
  axes: {
    type: {
      values: ["rau củ", "con vật"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với thử sai có hệ thống",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng thử sai có hệ thống",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt thử sai có hệ thống với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi thử sai có hệ thống",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục thử sai có hệ thống và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy giải bài toán tìm {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Thử sai có hệ thống nhé",
  },
};

export const C1_PROB_02_SEED: SkillSeed = {
  identity: C1_PROB_02_IDENTITY,
  dataset: C1_PROB_02_DATASET,
  levels: [
    {
      code: "GL-C1-PROB-MEAS-0001",
      template: "GT-028",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-MEAS-0002",
      template: "GT-028",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-MEAS-0003",
      template: "GT-028",
      band: "4-5",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-MEAS-0004",
      template: "GT-028",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TIME-0001",
      template: "GT-029",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TIME-0002",
      template: "GT-029",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TIME-0003",
      template: "GT-029",
      band: "4-5",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-TIME-0004",
      template: "GT-029",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-COIN-0001",
      template: "GT-030",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-COIN-0002",
      template: "GT-030",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-COIN-0003",
      template: "GT-030",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-COIN-0004",
      template: "GT-030",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PICT-0002",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PICT-0003",
      template: "GT-031",
      band: "5-6",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-PICT-0004",
      template: "GT-031",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-VENN-0001",
      template: "GT-032",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-VENN-0002",
      template: "GT-032",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-VENN-0003",
      template: "GT-032",
      band: "5-6",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-PROB-VENN-0004",
      template: "GT-032",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
  ],
};
