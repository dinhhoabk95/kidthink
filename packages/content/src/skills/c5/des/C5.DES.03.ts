import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DES_03_IDENTITY: SkillIdentity = {
  code: "C5.DES.03",
  strand_code: "C5.DES",
  competency_code: "C5",
  name: "So sánh bằng lời",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["describe", "compare"],
  tier: "core",
  prerequisites: ["C1.CMP.01", "C5.DES.01"],
  learning_objectives: [
    {
      code: "LO-C5.DES.03-01",
      behaviour: "Nhận biết và thực hành So sánh bằng lời ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DES.03-02",
      behaviour: "Vận dụng So sánh bằng lời trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DES.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới So sánh bằng lời",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DES_03_DATASET: SkillDataset = {
  skill_code: "C5.DES.03",
  concept_label: "So sánh bằng lời",
  surface: "game",
  items: [
    {
      id: "des_to_nho",
      label: "voi to hơn chuột",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "so sánh",
      },
    },
    {
      id: "des_cao_thap",
      label: "hươu cao hơn vịt",
      image: {
        kind: "emoji",
        ref: "🦒",
      },
      category: {
        type: "so sánh",
      },
    },
    {
      id: "des_dai_ngan",
      label: "thước dài hơn bút",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "so sánh",
      },
    },
    {
      id: "des_nhanh_cham",
      label: "thỏ nhanh hơn rùa",
      image: {
        kind: "emoji",
        ref: "🐇",
      },
      category: {
        type: "so sánh",
      },
    },
    {
      id: "des_nang_nhe",
      label: "đá nặng hơn lông",
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "so sánh",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với So sánh bằng lời",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng So sánh bằng lời",
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
    narration_template: "Chúng mình cùng tìm hiểu về So sánh bằng lời nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "des_to_nho",
    "des_cao_thap",
    "des_dai_ngan",
    "des_nhanh_cham",
    "des_nang_nhe",
  ],
};

export const C5_DES_03_SEED: SkillSeed = {
  identity: C5_DES_03_IDENTITY,
  dataset: C5_DES_03_DATASET,
  levels: [
    {
      code: "GL-C5-DES-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
  ],
};
