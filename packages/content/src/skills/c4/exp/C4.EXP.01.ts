import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_EXP_01_IDENTITY: SkillIdentity = {
  code: "C4.EXP.01",
  strand_code: "C4.EXP",
  competency_code: "C4",
  name: "Đoán trước khi làm",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["predict"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.EXP.01-01",
      behaviour: "Nhận biết và thực hành Đoán trước khi làm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.EXP.01-02",
      behaviour: "Vận dụng Đoán trước khi làm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.EXP.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đoán trước khi làm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_EXP_01_DATASET: SkillDataset = {
  skill_code: "C4.EXP.01",
  concept_label: "Đoán trước khi làm",
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
      description: "Làm quen cơ bản với Đoán trước khi làm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đoán trước khi làm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đoán trước khi làm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C4_EXP_01_SEED: SkillSeed = {
  identity: C4_EXP_01_IDENTITY,
  dataset: C4_EXP_01_DATASET,
  levels: [
    {
      code: "GL-C4-EXP-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-MAZE-0003",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TFRA-0001",
      template: "GT-019",
      band: "4-5",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TFRA-0002",
      template: "GT-019",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TFRA-0003",
      template: "GT-019",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TANG-0001",
      template: "GT-021",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TANG-0002",
      template: "GT-021",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-MTRX-0001",
      template: "GT-023",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-MTRX-0002",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
