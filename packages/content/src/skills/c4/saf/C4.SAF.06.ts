import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SAF_06_IDENTITY: SkillIdentity = {
  code: "C4.SAF.06",
  strand_code: "C4.SAF",
  competency_code: "C4",
  name: "Ai được phép chạm vào con",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["deduce", "describe"],
  tier: "advanced",
  prerequisites: ["C4.SOC.02"],
  learning_objectives: [
    {
      code: "LO-C4.SAF.06-01",
      behaviour:
        "Nhận biết và thực hành Ai được phép chạm vào con ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SAF.06-02",
      behaviour:
        "Vận dụng Ai được phép chạm vào con trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SAF.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Ai được phép chạm vào con",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SAF_06_DATASET: SkillDataset = {
  skill_code: "C4.SAF.06",
  concept_label: "Ai được phép chạm vào con",
  surface: "worksheet",
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
      description: "Làm quen cơ bản với Ai được phép chạm vào con",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ai được phép chạm vào con",
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
      "Chúng mình cùng tìm hiểu về Ai được phép chạm vào con nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C4_SAF_06_SEED: SkillSeed = {
  identity: C4_SAF_06_IDENTITY,
  dataset: C4_SAF_06_DATASET,
  levels: [
    {
      code: "GL-C4-SAF-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TAP-0011",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TCNT-0008",
      template: "GT-002",
      band: "4-5",
      difficulty: 5,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TCNT-0010",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
