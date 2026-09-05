import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ROT_03_IDENTITY: SkillIdentity = {
  code: "C2.ROT.03",
  strand_code: "C2.ROT",
  competency_code: "C2",
  name: "Xoay 270°",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["predict"],
  tier: "advanced",
  prerequisites: ["C2.ROT.02"],
  learning_objectives: [
    {
      code: "LO-C2.ROT.03-01",
      behaviour: "Nhận biết và thực hành Xoay 270° ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ROT.03-02",
      behaviour: "Vận dụng Xoay 270° trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ROT.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Xoay 270°",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ROT_03_DATASET: SkillDataset = {
  skill_code: "C2.ROT.03",
  concept_label: "Xoay 270°",
  surface: "game",
  items: [
    {
      id: "bed",
      label: "cái giường",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "chair",
      label: "cái ghế",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "apple",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Xoay 270°",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Xoay 270°",
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
    narration_template: "Chúng mình cùng tìm hiểu về Xoay 270° nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C2_ROT_03_SEED: SkillSeed = {
  identity: C2_ROT_03_IDENTITY,
  dataset: C2_ROT_03_DATASET,
  levels: [
    {
      code: "GL-C2-ROT-DOTS-0005",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-DOTS-0006",
      template: "GT-011",
      band: "5-6",
      difficulty: 5,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-MAZE-0005",
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-MAZE-0006",
      template: "GT-013",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-DIFF-0005",
      template: "GT-014",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-DIFF-0006",
      template: "GT-014",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-ISO-0005",
      template: "GT-017",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-ISO-0006",
      template: "GT-017",
      band: "5-6",
      difficulty: 5,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-TFRA-0005",
      template: "GT-019",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-TFRA-0006",
      template: "GT-019",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
  ],
};
