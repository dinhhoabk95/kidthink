import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ROT_04_IDENTITY: SkillIdentity = {
  code: "C2.ROT.04",
  strand_code: "C2.ROT",
  competency_code: "C2",
  name: "Nhận ra hình giống nhau sau khi xoay",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["compare", "infer"],
  tier: "advanced",
  prerequisites: ["C2.ROT.01"],
  learning_objectives: [
    {
      code: "LO-C2.ROT.04-01",
      behaviour:
        "Nhận biết và thực hành Nhận ra hình giống nhau sau khi xoay ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ROT.04-02",
      behaviour:
        "Vận dụng Nhận ra hình giống nhau sau khi xoay trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ROT.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhận ra hình giống nhau sau khi xoay",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ROT_04_DATASET: SkillDataset = {
  skill_code: "C2.ROT.04",
  concept_label: "Nhận ra hình giống nhau sau khi xoay",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhận ra hình giống nhau sau khi xoay",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Nhận ra hình giống nhau sau khi xoay",
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
      "Chúng mình cùng tìm hiểu về Nhận ra hình giống nhau sau khi xoay nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C2_ROT_04_SEED: SkillSeed = {
  identity: C2_ROT_04_IDENTITY,
  dataset: C2_ROT_04_DATASET,
  levels: [
    {
      code: "GL-C2-ROT-SHP-0006",
      template: "GT-019",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D2-04",
    },
    {
      code: "GL-C2-ROT-SHP-0007",
      template: "GT-019",
      band: "5-6",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D2-04",
    },
    {
      code: "GL-C2-ROT-SHP-0008",
      template: "GT-019",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D2-04",
    },
    {
      code: "GL-C2-ROT-SHP-0009",
      template: "GT-019",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D2-04",
    },
    {
      code: "GL-C2-ROT-SHP-0010",
      template: "GT-019",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D2-04",
    },
    {
      code: "GL-C2-ROT-TAP-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-TAP-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-PATT-0001",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-PATT-0002",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
  ],
};
