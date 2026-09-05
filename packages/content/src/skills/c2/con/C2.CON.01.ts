import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_CON_01_IDENTITY: SkillIdentity = {
  code: "C2.CON.01",
  strand_code: "C2.CON",
  competency_code: "C2",
  name: "Xếp hình theo mẫu",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match", "observe"],
  tier: "basic",
  prerequisites: ["C2.GEO.01"],
  learning_objectives: [
    {
      code: "LO-C2.CON.01-01",
      behaviour: "Nhận biết và thực hành Xếp hình theo mẫu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.CON.01-02",
      behaviour: "Vận dụng Xếp hình theo mẫu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.CON.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Xếp hình theo mẫu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_CON_01_DATASET: SkillDataset = {
  skill_code: "C2.CON.01",
  concept_label: "Xếp hình theo mẫu",
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
      description: "Làm quen cơ bản với Xếp hình theo mẫu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Xếp hình theo mẫu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Xếp hình theo mẫu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["cup", "bed", "chair", "apple", "banana"],
};

export const C2_CON_01_SEED: SkillSeed = {
  identity: C2_CON_01_IDENTITY,
  dataset: C2_CON_01_DATASET,
  levels: [
    {
      code: "GL-C2-TNG-SHP-0006",
      template: "GT-023",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D2-02",
    },
    {
      code: "GL-C2-TNG-SHP-0007",
      template: "GT-023",
      band: "5-6",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D2-02",
    },
    {
      code: "GL-C2-TNG-SHP-0008",
      template: "GT-023",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D2-02",
    },
    {
      code: "GL-C2-TNG-SHP-0009",
      template: "GT-023",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D2-02",
    },
    {
      code: "GL-C2-TNG-SHP-0010",
      template: "GT-023",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D2-02",
    },
    {
      code: "GL-C2-CON-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
  ],
};
