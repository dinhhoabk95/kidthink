import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_AUD_06_IDENTITY: SkillIdentity = {
  code: "C4.AUD.06",
  strand_code: "C4.AUD",
  competency_code: "C4",
  name: "Âm sắc nhạc cụ",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "compare"],
  tier: "advanced",
  prerequisites: ["C4.AUD.05"],
  learning_objectives: [
    {
      code: "LO-C4.AUD.06-01",
      behaviour: "Nhận biết và thực hành Âm sắc nhạc cụ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.AUD.06-02",
      behaviour: "Vận dụng Âm sắc nhạc cụ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.AUD.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Âm sắc nhạc cụ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_AUD_06_DATASET: SkillDataset = {
  skill_code: "C4.AUD.06",
  concept_label: "Âm sắc nhạc cụ",
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
      description: "Làm quen cơ bản với Âm sắc nhạc cụ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Âm sắc nhạc cụ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Âm sắc nhạc cụ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C4_AUD_06_SEED: SkillSeed = {
  identity: C4_AUD_06_IDENTITY,
  dataset: C4_AUD_06_DATASET,
  levels: [
    {
      code: "GL-C4-AUD-TAP-0012",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TAP-0013",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PATT-0012",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PATT-0013",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
