import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_03_IDENTITY: SkillIdentity = {
  code: "C5.WRT.03",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Nét xiên, nét cong",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "create"],
  tier: "core",
  prerequisites: ["C5.WRT.02"],
  learning_objectives: [
    {
      code: "LO-C5.WRT.03-01",
      behaviour: "Nhận biết và thực hành Nét xiên, nét cong ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.03-02",
      behaviour: "Vận dụng Nét xiên, nét cong trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nét xiên, nét cong",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_03_DATASET: SkillDataset = {
  skill_code: "C5.WRT.03",
  concept_label: "Nét xiên, nét cong",
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
      description: "Làm quen cơ bản với Nét xiên, nét cong",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nét xiên, nét cong",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nét xiên, nét cong nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C5_WRT_03_SEED: SkillSeed = {
  identity: C5_WRT_03_IDENTITY,
  dataset: C5_WRT_03_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCMP-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCMP-0006",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PATT-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PATT-0006",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
  ],
};
