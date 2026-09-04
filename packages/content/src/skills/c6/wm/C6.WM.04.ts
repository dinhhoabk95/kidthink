import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_WM_04_IDENTITY: SkillIdentity = {
  code: "C6.WM.04",
  strand_code: "C6.WM",
  competency_code: "C6",
  name: "Nhớ hình sau khi biến mất",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["recall"],
  tier: "core",
  prerequisites: ["C4.MEM.02"],
  learning_objectives: [
    {
      code: "LO-C6.WM.04-01",
      behaviour:
        "Nhận biết và thực hành Nhớ hình sau khi biến mất ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.WM.04-02",
      behaviour:
        "Vận dụng Nhớ hình sau khi biến mất trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.WM.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhớ hình sau khi biến mất",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_WM_04_DATASET: SkillDataset = {
  skill_code: "C6.WM.04",
  concept_label: "Nhớ hình sau khi biến mất",
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
      description: "Làm quen cơ bản với Nhớ hình sau khi biến mất",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ hình sau khi biến mất",
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
      "Chúng mình cùng tìm hiểu về Nhớ hình sau khi biến mất nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C6_WM_04_SEED: SkillSeed = {
  identity: C6_WM_04_IDENTITY,
  dataset: C6_WM_04_DATASET,
  levels: [
    {
      code: "GL-C6-SUB-FAST-0018",
      template: "GT-012",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLASH-0027",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLASH-0028",
      template: "GT-012",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLASH-0029",
      template: "GT-012",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-PAIR-0009",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D1-08",
    },
    {
      code: "GL-C1-DOT-PAIR-0010",
      template: "GT-005",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D1-08",
    },
  ],
};
