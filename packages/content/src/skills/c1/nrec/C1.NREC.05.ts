import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_NREC_05_IDENTITY: SkillIdentity = {
  code: "C1.NREC.05",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Ghép số với lượng",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match"],
  tier: "basic",
  prerequisites: ["C1.NREC.02", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.05-01",
      behaviour: "Nhận biết và thực hành Ghép số với lượng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.05-02",
      behaviour: "Vận dụng Ghép số với lượng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép số với lượng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_05_DATASET: SkillDataset = {
  skill_code: "C1.NREC.05",
  concept_label: "Ghép số với lượng",
  surface: "game",
  items: [
    {
      id: "n0",
      label: "số không",
      glyph: "0",
      value: 0,
      audio_path: "/audio/voice/common/numbers/0.mp3",
      image: {
        kind: "emoji",
        ref: "0️⃣",
      },
      contrast_group: "numeral",
      category: {
        role: "chữ số",
      },
    },
    {
      id: "n1",
      label: "số một",
      glyph: "1",
      value: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
      contrast_group: "numeral",
      category: {
        role: "chữ số",
      },
    },
    {
      id: "n2",
      label: "số hai",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
      contrast_group: "numeral",
      category: {
        role: "chữ số",
      },
    },
    {
      id: "n3",
      label: "số ba",
      glyph: "3",
      value: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
      contrast_group: "numeral",
      category: {
        role: "chữ số",
      },
    },
    {
      id: "n4",
      label: "số bốn",
      glyph: "4",
      value: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      image: {
        kind: "emoji",
        ref: "4️⃣",
      },
      contrast_group: "numeral",
      category: {
        role: "chữ số",
      },
    },
    {
      id: "n5",
      label: "số năm",
      glyph: "5",
      value: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      image: {
        kind: "emoji",
        ref: "5️⃣",
      },
      contrast_group: "numeral",
      category: {
        role: "chữ số",
      },
    },
    {
      id: "qty_0",
      label: "không có quả táo nào",
      glyph: "∅",
      value: 0,
      image: {
        kind: "emoji",
        ref: "⬜",
      },
      contrast_group: "quantity",
      category: {
        role: "lượng",
      },
    },
    {
      id: "qty_1",
      label: "một quả táo",
      glyph: "🍎",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "quantity",
      category: {
        role: "lượng",
      },
    },
    {
      id: "qty_2",
      label: "hai quả táo",
      glyph: "🍎🍎",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🍎🍎",
      },
      contrast_group: "quantity",
      category: {
        role: "lượng",
      },
    },
    {
      id: "qty_3",
      label: "ba quả táo",
      glyph: "🍎🍎🍎",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍎🍎🍎",
      },
      contrast_group: "quantity",
      category: {
        role: "lượng",
      },
    },
    {
      id: "qty_4",
      label: "bốn quả táo",
      glyph: "🍎🍎🍎🍎",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍎🍎🍎🍎",
      },
      contrast_group: "quantity",
      category: {
        role: "lượng",
      },
    },
    {
      id: "qty_5",
      label: "năm quả táo",
      glyph: "🍎🍎🍎🍎🍎",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍎🍎🍎🍎🍎",
      },
      contrast_group: "quantity",
      category: {
        role: "lượng",
      },
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "n0",
      target_id: "qty_0",
      metadata: {
        relation: "numeral_to_quantity",
      },
    },
    {
      type: "pair",
      source_id: "n1",
      target_id: "qty_1",
      metadata: {
        relation: "numeral_to_quantity",
      },
    },
    {
      type: "pair",
      source_id: "n2",
      target_id: "qty_2",
      metadata: {
        relation: "numeral_to_quantity",
      },
    },
    {
      type: "pair",
      source_id: "n3",
      target_id: "qty_3",
      metadata: {
        relation: "numeral_to_quantity",
      },
    },
    {
      type: "pair",
      source_id: "n4",
      target_id: "qty_4",
      metadata: {
        relation: "numeral_to_quantity",
      },
    },
    {
      type: "pair",
      source_id: "n5",
      target_id: "qty_5",
      metadata: {
        relation: "numeral_to_quantity",
      },
    },
  ],
  axes: {
    role: {
      values: ["chữ số", "lượng"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ghép số với lượng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng ghép số với lượng",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt ghép số với lượng với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi ghép số với lượng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục ghép số với lượng và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé ghép chữ số với đúng số lượng nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Ghép số với lượng nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_NREC_05_SEED: SkillSeed = {
  identity: C1_NREC_05_IDENTITY,
  dataset: C1_NREC_05_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-NUM-0010",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-NUM-0011",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-NUM-0012",
      template: "GT-012",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-NUM-0013",
      template: "GT-012",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0012",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0013",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0014",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0015",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TCMP-0015",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TCMP-0016",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TCMP-0017",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TCMP-0018",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-PATT-0015",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-PATT-0016",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-PATT-0017",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-PATT-0018",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-SLOT-0007",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-SLOT-0008",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-SLOT-0009",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-SLOT-0010",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-GRID-0002",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-GRID-0003",
      template: "GT-020",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-GRID-0004",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
  ],
};
