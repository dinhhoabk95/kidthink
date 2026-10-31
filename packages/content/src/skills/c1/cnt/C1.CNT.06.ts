import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CNT_06_IDENTITY: SkillIdentity = {
  code: "C1.CNT.06",
  strand_code: "C1.CNT",
  competency_code: "C1",
  name: "Đếm đến 5",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["count", "sort"],
  tier: "advanced",
  prerequisites: ["C1.CNT.05"],
  learning_objectives: [
    {
      code: "LO-C1.CNT.06-01",
      behaviour: "Nhận biết và thực hành Đếm theo nhóm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CNT.06-02",
      behaviour: "Vận dụng Đếm theo nhóm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CNT.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đếm theo nhóm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CNT_06_DATASET: SkillDataset = {
  skill_code: "C1.CNT.06",
  concept_label: "Đếm đến 5",
  surface: "game",
  items: [
    {
      id: "n1",
      label: "số một",
      glyph: "1",
      value: 1,
      contrast_group: "quantity",
      ordering: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      category: {
        type: "con vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐿️",
      },
    },
    {
      id: "n2",
      label: "số hai",
      glyph: "2",
      value: 2,
      contrast_group: "quantity",
      ordering: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      category: {
        type: "con vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐰",
      },
    },
    {
      id: "n3",
      label: "số ba",
      glyph: "3",
      value: 3,
      contrast_group: "quantity",
      ordering: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      category: {
        type: "con vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🦔",
      },
    },
    {
      id: "n4",
      label: "số bốn",
      glyph: "4",
      value: 4,
      contrast_group: "quantity",
      ordering: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      category: {
        type: "con vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐻",
      },
    },
    {
      id: "n5",
      label: "số năm",
      glyph: "5",
      value: 5,
      contrast_group: "quantity",
      ordering: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      category: {
        type: "con vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🦌",
      },
    },
    // --- Ngữ liệu WB04: Nhóm bánh ngọt & thú cưng ---
    {
      id: "cnt06_croissant_three",
      label: "ba bánh sừng bò",
      glyph: "🥐🥐🥐",
      value: 3,
      contrast_group: "bakery",
      ordering: 6,
      category: { type: "tiệm bánh" },
      image: { kind: "emoji", ref: "🥐" },
    },
    {
      id: "cnt06_cupcake_four",
      label: "bốn chiếc bánh nhỏ",
      glyph: "🧁🧁🧁🧁",
      value: 4,
      contrast_group: "bakery",
      ordering: 7,
      category: { type: "tiệm bánh" },
      image: { kind: "emoji", ref: "🧁" },
    },
    {
      id: "cnt06_cat_four",
      label: "bốn chú mèo con",
      glyph: "🐱🐱🐱🐱",
      value: 4,
      contrast_group: "pets",
      ordering: 8,
      category: { type: "thú cưng" },
      image: { kind: "emoji", ref: "🐱" },
    },
    {
      id: "cnt06_bread_five",
      label: "năm ổ bánh mì",
      glyph: "🍞🍞🍞🍞🍞",
      value: 5,
      contrast_group: "bakery",
      ordering: 9,
      category: { type: "tiệm bánh" },
      image: { kind: "emoji", ref: "🍞" },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "n1",
      target_id: "n5",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đếm đến 5",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng theo yêu cầu đếm đến 5",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt theo yêu cầu đếm đến 5 với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đếm đến 5",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đếm đến 5 và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng học đếm đến 5 nhé",
  },
  ordering: [
    "n1",
    "n2",
    "n3",
    "n4",
    "n5",
    "cnt06_croissant_three",
    "cnt06_cupcake_four",
    "cnt06_cat_four",
    "cnt06_bread_five",
  ],
};

export const C1_CNT_06_SEED: SkillSeed = {
  identity: C1_CNT_06_IDENTITY,
  dataset: C1_CNT_06_DATASET,
  levels: [
    {
      code: "GL-C1-SUB-SYM-0031",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-SUB-SYM-0033",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TAP-0027",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    // --- Bổ sung Montessori WB04 ---
    {
      code: "GL-C1-CNT-TAP-0147",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "animal",
      rounds: 3,
      montessori_ref: "WB04-D1",
    },
  ],
};
