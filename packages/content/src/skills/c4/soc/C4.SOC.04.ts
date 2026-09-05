import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SOC_04_IDENTITY: SkillIdentity = {
  code: "C4.SOC.04",
  strand_code: "C4.SOC",
  competency_code: "C4",
  name: "Nghề nghiệp – dụng cụ",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["match", "infer"],
  tier: "core",
  prerequisites: ["C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C4.SOC.04-01",
      behaviour: "Nhận biết và thực hành Nghề nghiệp – dụng cụ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SOC.04-02",
      behaviour: "Vận dụng Nghề nghiệp – dụng cụ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SOC.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nghề nghiệp – dụng cụ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SOC_04_DATASET: SkillDataset = {
  skill_code: "C4.SOC.04",
  concept_label: "Nghề nghiệp – dụng cụ",
  surface: "game",
  items: [
    {
      id: "spoon",
      label: "cái thìa",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "cup",
      label: "cái cốc",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "đồ dùng",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghề nghiệp – dụng cụ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghề nghiệp – dụng cụ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nghề nghiệp – dụng cụ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C4_SOC_04_SEED: SkillSeed = {
  identity: C4_SOC_04_IDENTITY,
  dataset: C4_SOC_04_DATASET,
  levels: [
    {
      code: "GL-C4-SOC-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PATT-0009",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PATT-0010",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
