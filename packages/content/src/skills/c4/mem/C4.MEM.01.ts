import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MEM_01_IDENTITY: SkillIdentity = {
  code: "C4.MEM.01",
  strand_code: "C4.MEM",
  competency_code: "C4",
  name: "Memory Card — tìm cặp",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["recall", "match"],
  tier: "basic",
  prerequisites: ["C3.ANA.01"],
  learning_objectives: [
    {
      code: "LO-C4.MEM.01-01",
      behaviour: "Nhận biết và thực hành Memory Card — tìm cặp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MEM.01-02",
      behaviour: "Vận dụng Memory Card — tìm cặp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MEM.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Memory Card — tìm cặp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MEM_01_DATASET: SkillDataset = {
  skill_code: "C4.MEM.01",
  concept_label: "Memory Card — tìm cặp",
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
      description: "Làm quen cơ bản với Memory Card — tìm cặp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Memory Card — tìm cặp",
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
    narration_template: "Chúng mình cùng tìm hiểu về Memory Card — tìm cặp nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C4_MEM_01_SEED: SkillSeed = {
  identity: C4_MEM_01_IDENTITY,
  dataset: C4_MEM_01_DATASET,
  levels: [
    {
      code: "GL-C4-TAP-INS-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D3-08",
    },
    {
      code: "GL-C4-TAP-INS-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D3-08",
    },
    {
      code: "GL-C4-TAP-INS-0003",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D3-08",
    },
    {
      code: "GL-C4-TAP-INS-0004",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D3-08",
    },
    {
      code: "GL-C4-TAP-INS-0005",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D3-08",
    },
  ],
};
