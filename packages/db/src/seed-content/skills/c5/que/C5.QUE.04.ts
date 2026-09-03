import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_QUE_04_IDENTITY: SkillIdentity = {
  code: "C5.QUE.04",
  strand_code: "C5.QUE",
  competency_code: "C5",
  name: 'Trả lời "Khi nào?"',
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "sequence"],
  tier: "advanced",
  prerequisites: ["C5.QUE.02", "C1.MEAS.10"],
  learning_objectives: [
    {
      code: "LO-C5.QUE.04-01",
      behaviour: 'Nhận biết và thực hành Trả lời "Khi nào?" ở mức cơ bản',
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.QUE.04-02",
      behaviour: 'Vận dụng Trả lời "Khi nào?" trong môi trường tương tác',
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.QUE.04-03",
      behaviour: 'Giải quyết vấn đề nâng cao liên quan tới Trả lời "Khi nào?"',
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_QUE_04_DATASET: SkillDataset = {
  skill_code: "C5.QUE.04",
  concept_label: 'Trả lời "Khi nào?"',
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
      description: 'Làm quen cơ bản với Trả lời "Khi nào?"',
    },
    {
      rung: 2,
      dimension: "range",
      description: 'Nhận biết và chọn đúng Trả lời "Khi nào?"',
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
    narration_template: 'Chúng mình cùng tìm hiểu về Trả lời "Khi nào?" nhé',
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C5_QUE_04_SEED: SkillSeed = {
  identity: C5_QUE_04_IDENTITY,
  dataset: C5_QUE_04_DATASET,
  levels: [
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
