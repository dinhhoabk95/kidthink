import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_QUE_02_IDENTITY: SkillIdentity = {
  code: "C5.QUE.02",
  strand_code: "C5.QUE",
  competency_code: "C5",
  name: 'Trả lời "Cái gì?"',
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["listen", "infer"],
  tier: "basic",
  prerequisites: ["C5.LIS.01"],
  learning_objectives: [
    {
      code: "LO-C5.QUE.02-01",
      behaviour: 'Nhận biết và thực hành Trả lời "Cái gì?" ở mức cơ bản',
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.QUE.02-02",
      behaviour: 'Vận dụng Trả lời "Cái gì?" trong môi trường tương tác',
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.QUE.02-03",
      behaviour: 'Giải quyết vấn đề nâng cao liên quan tới Trả lời "Cái gì?"',
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_QUE_02_DATASET: SkillDataset = {
  skill_code: "C5.QUE.02",
  concept_label: 'Trả lời "Cái gì?"',
  surface: "game",
  items: [
    {
      id: "banana",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: 'Làm quen cơ bản với Trả lời "Cái gì?"',
    },
    {
      rung: 2,
      dimension: "range",
      description: 'Nhận biết và chọn đúng Trả lời "Cái gì?"',
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
    narration_template: 'Chúng mình cùng tìm hiểu về Trả lời "Cái gì?" nhé',
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C5_QUE_02_SEED: SkillSeed = {
  identity: C5_QUE_02_IDENTITY,
  dataset: C5_QUE_02_DATASET,
  levels: [
    {
      code: "GL-C5-QUE-SHAD-0006",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SHAD-0007",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SHAD-0008",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SHAD-0009",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SHAD-0010",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0008",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0009",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0010",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
  ],
};
