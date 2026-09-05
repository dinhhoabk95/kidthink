import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_CON_04_IDENTITY: SkillIdentity = {
  code: "C2.CON.04",
  strand_code: "C2.CON",
  competency_code: "C2",
  name: "Ghép khối 3D",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["create", "infer"],
  tier: "advanced",
  prerequisites: ["C2.CON.03"],
  learning_objectives: [
    {
      code: "LO-C2.CON.04-01",
      behaviour: "Nhận biết và thực hành Ghép khối 3D ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.CON.04-02",
      behaviour: "Vận dụng Ghép khối 3D trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.CON.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép khối 3D",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_CON_04_DATASET: SkillDataset = {
  skill_code: "C2.CON.04",
  concept_label: "Ghép khối 3D",
  surface: "game",
  items: [
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
    {
      id: "corn",
      label: "bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
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
      description: "Làm quen cơ bản với Ghép khối 3D",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghép khối 3D",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ghép khối 3D nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C2_CON_04_SEED: SkillSeed = {
  identity: C2_CON_04_IDENTITY,
  dataset: C2_CON_04_DATASET,
  levels: [
    {
      code: "GL-C2-CON-SOLID-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-SOLID-0002",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-PRJ-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D2-06",
    },
    {
      code: "GL-C2-PRJ-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D2-06",
    },
    {
      code: "GL-C3-RNK-ORD-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D4-06",
    },
    {
      code: "GL-C3-RNK-ORD-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D4-06",
    },
    {
      code: "GL-C3-RNK-ORD-0006",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D4-06",
    },
    {
      code: "GL-C2-TOW-STK-0001",
      template: "GT-023",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-TOW-STK-0002",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-TOW-STK-0003",
      template: "GT-023",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-TOW-STK-0004",
      template: "GT-023",
      band: "4-5",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-TOW-STK-0005",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-CON-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-SIZE-0005",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-SIZE-0006",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
  ],
};
