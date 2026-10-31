import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CNT_02_IDENTITY: SkillIdentity = {
  code: "C1.CNT.02",
  strand_code: "C1.CNT",
  competency_code: "C1",
  name: "Đếm một-một",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["count", "observe"],
  tier: "core",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.CNT.02-01",
      behaviour: "Nhận biết và thực hành Đếm khi di chuyển ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CNT.02-02",
      behaviour: "Vận dụng Đếm khi di chuyển trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CNT.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đếm khi di chuyển",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CNT_02_DATASET: SkillDataset = {
  skill_code: "C1.CNT.02",
  concept_label: "Đếm một-một",
  surface: "game",
  items: [
    {
      id: "cnt02_1",
      label: "một chú gấu bông",
      glyph: "🧸",
      value: 1,
      contrast_group: "quantity",
      ordering: 1,
      category: {
        type: "đồ chơi nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🧸",
      },
    },
    {
      id: "cnt02_2",
      label: "hai chiếc ô tô",
      glyph: "🚗🚗",
      value: 2,
      contrast_group: "quantity",
      ordering: 2,
      category: {
        type: "đồ chơi nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🚗",
      },
    },
    {
      id: "cnt02_3",
      label: "ba chiếc máy bay",
      glyph: "✈️✈️✈️",
      value: 3,
      contrast_group: "quantity",
      ordering: 3,
      category: {
        type: "đồ chơi nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "✈️",
      },
    },
    {
      id: "cnt02_4",
      label: "bốn quả bóng bay",
      glyph: "🎈🎈🎈🎈",
      value: 4,
      contrast_group: "quantity",
      ordering: 4,
      category: {
        type: "đồ chơi nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🎈",
      },
    },
    {
      id: "cnt02_5",
      label: "năm quả bóng tròn",
      glyph: "⚽⚽⚽⚽⚽",
      value: 5,
      contrast_group: "quantity",
      ordering: 5,
      category: {
        type: "đồ chơi nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "⚽",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "cnt02_1",
      target_id: "cnt02_5",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đếm một-một",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đếm một-một",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt đếm một-một với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đếm một-một",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đếm một-một và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng học đếm từng vật một nhé",
  },
  ordering: ["cnt02_1", "cnt02_2", "cnt02_3", "cnt02_4", "cnt02_5"],
};

export const C1_CNT_02_SEED: SkillSeed = {
  identity: C1_CNT_02_IDENTITY,
  dataset: C1_CNT_02_DATASET,
  levels: [
    {
      code: "GL-C1-CNT-INTRO-0002",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 1,
    },
    {
      code: "GL-C1-CNT-CARD-0004",
      template: "GT-012",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-STEP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-QTA-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-QTA-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-BSK-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
