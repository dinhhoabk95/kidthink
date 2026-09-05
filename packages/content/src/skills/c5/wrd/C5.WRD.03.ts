import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRD_03_IDENTITY: SkillIdentity = {
  code: "C5.WRD.03",
  strand_code: "C5.WRD",
  competency_code: "C5",
  name: "Đánh vần tiếng đơn giản",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["solve", "sequence"],
  tier: "advanced",
  prerequisites: ["C5.WRD.02", "C5.PHO.07"],
  learning_objectives: [
    {
      code: "LO-C5.WRD.03-01",
      behaviour: "Nhận biết và thực hành Đánh vần tiếng đơn giản ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRD.03-02",
      behaviour: "Vận dụng Đánh vần tiếng đơn giản trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRD.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đánh vần tiếng đơn giản",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRD_03_DATASET: SkillDataset = {
  skill_code: "C5.WRD.03",
  concept_label: "Đánh vần tiếng đơn giản",
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
      description: "Làm quen cơ bản với Đánh vần tiếng đơn giản",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đánh vần tiếng đơn giản",
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
      "Chúng mình cùng tìm hiểu về Đánh vần tiếng đơn giản nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C5_WRD_03_SEED: SkillSeed = {
  identity: C5_WRD_03_IDENTITY,
  dataset: C5_WRD_03_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SLOT-0003",
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SLOT-0004",
      template: "GT-008",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-MAZE-0001",
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-MAZE-0002",
      template: "GT-013",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-BAL-0001",
      template: "GT-016",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-BAL-0002",
      template: "GT-016",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-BOND-0001",
      template: "GT-018",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-BOND-0002",
      template: "GT-018",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
  ],
};
