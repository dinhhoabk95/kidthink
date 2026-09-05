import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CNT_11_IDENTITY: SkillIdentity = {
  code: "C1.CNT.11",
  strand_code: "C1.CNT",
  competency_code: "C1",
  name: "Subitizing — nhận lượng tức thì (1–5)",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["observe", "count"],
  tier: "core",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.CNT.11-01",
      behaviour:
        "Nhận biết và thực hành Subitizing — nhận lượng tức thì (1–5) ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CNT.11-02",
      behaviour:
        "Vận dụng Subitizing — nhận lượng tức thì (1–5) trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CNT.11-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Subitizing — nhận lượng tức thì (1–5)",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CNT_11_DATASET: SkillDataset = {
  skill_code: "C1.CNT.11",
  concept_label: "Subitizing — nhận lượng tức thì (1–5)",
  surface: "game",
  items: [
    {
      id: "n0",
      label: "không",
      glyph: "0",
      value: 0,
      image: {
        kind: "emoji",
        ref: "0️⃣",
      },
    },
    {
      id: "n1",
      label: "một",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
    },
    {
      id: "n2",
      label: "hai",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
    },
    {
      id: "n3",
      label: "ba",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
    },
    {
      id: "n4",
      label: "bốn",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "4️⃣",
      },
    },
    {
      id: "n5",
      label: "năm",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "5️⃣",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Subitizing — nhận lượng tức thì (1–5)",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Subitizing — nhận lượng tức thì (1–5)",
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
      "Chúng mình cùng tìm hiểu về Subitizing — nhận lượng tức thì (1–5) nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_CNT_11_SEED: SkillSeed = {
  identity: C1_CNT_11_IDENTITY,
  dataset: C1_CNT_11_DATASET,
  levels: [
    {
      code: "GL-C1-SUB-FAST-0019",
      template: "GT-012",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-FAST-0020",
      template: "GT-012",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TAP-0037",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TAP-0038",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TAP-0039",
      template: "GT-001",
      band: "3-4",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TAP-0040",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCNT-0024",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCNT-0025",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCNT-0026",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCNT-0027",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCMP-0026",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCMP-0027",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCMP-0028",
      template: "GT-003",
      band: "3-4",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCMP-0029",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-PAIR-0013",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-PAIR-0014",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-PAIR-0015",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-PAIR-0016",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-PATT-0007",
      template: "GT-005",
      band: "3-4",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-PATT-0008",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
  ],
};
