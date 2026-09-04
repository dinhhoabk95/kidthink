import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_CON_03_IDENTITY: SkillIdentity = {
  code: "C2.CON.03",
  strand_code: "C2.CON",
  competency_code: "C2",
  name: "Ghép khối Lego",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["create", "plan"],
  tier: "core",
  prerequisites: ["C2.CON.01"],
  learning_objectives: [
    {
      code: "LO-C2.CON.03-01",
      behaviour: "Nhận biết và thực hành Ghép khối Lego ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.CON.03-02",
      behaviour: "Vận dụng Ghép khối Lego trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.CON.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép khối Lego",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_CON_03_DATASET: SkillDataset = {
  skill_code: "C2.CON.03",
  concept_label: "Ghép khối Lego",
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
      description: "Làm quen cơ bản với Ghép khối Lego",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghép khối Lego",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ghép khối Lego nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C2_CON_03_SEED: SkillSeed = {
  identity: C2_CON_03_IDENTITY,
  dataset: C2_CON_03_DATASET,
  levels: [
    {
      code: "GL-C2-PRJ-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D2-06",
    },
    {
      code: "GL-C2-PRJ-TAP-0004",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D2-06",
    },
    {
      code: "GL-C2-SHP-BSK-0008",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D2-05",
    },
    {
      code: "GL-C2-SHP-BSK-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
      legacy_v1_ref: "D2-05",
    },
    {
      code: "GL-C2-SHP-BSK-0010",
      template: "GT-003",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D2-05",
    },
    {
      code: "GL-C2-HOL-SLOT-0009",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D2-01",
    },
    {
      code: "GL-C2-HOL-SLOT-0010",
      template: "GT-008",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D2-01",
    },
    {
      code: "GL-C2-ROB-BLD-0001",
      template: "GT-023",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D2-07",
    },
    {
      code: "GL-C2-ROB-BLD-0002",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D2-07",
    },
    {
      code: "GL-C2-ROB-BLD-0003",
      template: "GT-023",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D2-07",
    },
    {
      code: "GL-C2-ROB-BLD-0004",
      template: "GT-023",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D2-07",
    },
    {
      code: "GL-C2-ROB-BLD-0005",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D2-07",
    },
  ],
};
