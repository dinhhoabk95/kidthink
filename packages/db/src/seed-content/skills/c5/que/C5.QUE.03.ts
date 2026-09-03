import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_QUE_03_IDENTITY: SkillIdentity = {
  code: "C5.QUE.03",
  strand_code: "C5.QUE",
  competency_code: "C5",
  name: 'Trả lời "Ở đâu?"',
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "infer"],
  tier: "core",
  prerequisites: ["C5.QUE.02", "C2.ORI.07"],
  learning_objectives: [
    {
      code: "LO-C5.QUE.03-01",
      behaviour: 'Nhận biết và thực hành Trả lời "Ở đâu?" ở mức cơ bản',
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.QUE.03-02",
      behaviour: 'Vận dụng Trả lời "Ở đâu?" trong môi trường tương tác',
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.QUE.03-03",
      behaviour: 'Giải quyết vấn đề nâng cao liên quan tới Trả lời "Ở đâu?"',
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_QUE_03_DATASET: SkillDataset = {
  skill_code: "C5.QUE.03",
  concept_label: 'Trả lời "Ở đâu?"',
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: 'Làm quen cơ bản với Trả lời "Ở đâu?"',
    },
    {
      rung: 2,
      dimension: "range",
      description: 'Nhận biết và chọn đúng Trả lời "Ở đâu?"',
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
    narration_template: 'Chúng mình cùng tìm hiểu về Trả lời "Ở đâu?" nhé',
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C5_QUE_03_SEED: SkillSeed = {
  identity: C5_QUE_03_IDENTITY,
  dataset: C5_QUE_03_DATASET,
  levels: [
    {
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
