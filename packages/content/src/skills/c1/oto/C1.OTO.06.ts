import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_OTO_06_IDENTITY: SkillIdentity = {
  code: "C1.OTO.06",
  strand_code: "C1.OTO",
  competency_code: "C1",
  name: "Ghép theo thứ tự",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["match", "sequence"],
  tier: "core",
  prerequisites: ["C1.OTO.01", "C1.NREC.09"],
  learning_objectives: [
    {
      code: "LO-C1.OTO.06-01",
      behaviour: "Nhận biết và thực hành Ghép theo thứ tự ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.OTO.06-02",
      behaviour: "Vận dụng Ghép theo thứ tự trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.OTO.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép theo thứ tự",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_OTO_06_DATASET: SkillDataset = {
  skill_code: "C1.OTO.06",
  concept_label: "Ghép theo thứ tự",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ghép theo thứ tự",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghép theo thứ tự",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ghép theo thứ tự nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C1_OTO_06_SEED: SkillSeed = {
  identity: C1_OTO_06_IDENTITY,
  dataset: C1_OTO_06_DATASET,
  levels: [
    {
      code: "GL-C1-OTO-TAP-0021",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TAP-0022",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TAP-0023",
      template: "GT-001",
      band: "3-4",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TAP-0024",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0021",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0022",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0023",
      template: "GT-003",
      band: "3-4",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0024",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0021",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0022",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0023",
      template: "GT-005",
      band: "3-4",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0024",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0013",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0014",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0015",
      template: "GT-008",
      band: "3-4",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0016",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PUZZ-0005",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PUZZ-0006",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PUZZ-0007",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PUZZ-0008",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
  ],
};
