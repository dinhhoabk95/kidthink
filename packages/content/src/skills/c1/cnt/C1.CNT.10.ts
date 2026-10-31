import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CNT_10_IDENTITY: SkillIdentity = {
  code: "C1.CNT.10",
  strand_code: "C1.CNT",
  competency_code: "C1",
  name: "Đếm cách 2",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["verify"],
  tier: "advanced",
  prerequisites: ["C1.CNT.03"],
  learning_objectives: [
    {
      code: "LO-C1.CNT.10-01",
      behaviour: "Nhận biết và thực hành Kiểm tra kết quả đếm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CNT.10-02",
      behaviour: "Vận dụng Kiểm tra kết quả đếm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CNT.10-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Kiểm tra kết quả đếm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CNT_10_DATASET: SkillDataset = {
  skill_code: "C1.CNT.10",
  concept_label: "Đếm cách 2",
  surface: "game",
  items: [
    {
      id: "n2",
      label: "hai quả anh đào",
      glyph: "🍒",
      value: 2,
      contrast_group: "quantity",
      ordering: 1,
      category: {
        type: "bước đếm hai",
      },
      image: {
        kind: "emoji",
        ref: "🍒",
      },
    },
    {
      id: "n4",
      label: "bốn quả anh đào",
      glyph: "🍒🍒",
      value: 4,
      contrast_group: "quantity",
      ordering: 2,
      category: {
        type: "bước đếm hai",
      },
      image: {
        kind: "emoji",
        ref: "🍒",
      },
    },
    {
      id: "n6",
      label: "sáu quả anh đào",
      glyph: "🍒🍒🍒",
      value: 6,
      contrast_group: "quantity",
      ordering: 3,
      category: {
        type: "bước đếm hai",
      },
      image: {
        kind: "emoji",
        ref: "🍒",
      },
    },
    {
      id: "n8",
      label: "tám quả anh đào",
      glyph: "🍒🍒🍒🍒",
      value: 8,
      contrast_group: "quantity",
      ordering: 4,
      category: {
        type: "bước đếm hai",
      },
      image: {
        kind: "emoji",
        ref: "🍒",
      },
    },
    {
      id: "n10",
      label: "mười quả anh đào",
      glyph: "🍒🍒🍒🍒🍒",
      value: 10,
      contrast_group: "quantity",
      ordering: 5,
      category: {
        type: "bước đếm hai",
      },
      image: {
        kind: "emoji",
        ref: "🍒",
      },
    },
    {
      id: "n12",
      label: "mười hai quả anh đào",
      glyph: "🍒🍒🍒🍒🍒🍒",
      value: 12,
      contrast_group: "quantity",
      ordering: 6,
      category: {
        type: "bước đếm hai",
      },
      image: {
        kind: "emoji",
        ref: "🍒",
      },
    },
    {
      id: "n14",
      label: "mười bốn quả anh đào",
      glyph: "🍒🍒🍒🍒🍒🍒🍒",
      value: 14,
      contrast_group: "quantity",
      ordering: 7,
      category: {
        type: "bước đếm hai",
      },
      image: {
        kind: "emoji",
        ref: "🍒",
      },
    },
    {
      id: "n16",
      label: "mười sáu quả anh đào",
      glyph: "🍒🍒🍒🍒🍒🍒🍒🍒",
      value: 16,
      contrast_group: "quantity",
      ordering: 8,
      category: {
        type: "bước đếm hai",
      },
      image: {
        kind: "emoji",
        ref: "🍒",
      },
    },
    {
      id: "n18",
      label: "mười tám quả anh đào",
      glyph: "🍒🍒🍒🍒🍒🍒🍒🍒🍒",
      value: 18,
      contrast_group: "quantity",
      ordering: 9,
      category: {
        type: "bước đếm hai",
      },
      image: {
        kind: "emoji",
        ref: "🍒",
      },
    },
    {
      id: "n20",
      label: "hai mươi quả anh đào",
      glyph: "🍒🍒🍒🍒🍒🍒🍒🍒🍒🍒",
      value: 20,
      contrast_group: "quantity",
      ordering: 10,
      category: {
        type: "bước đếm hai",
      },
      image: {
        kind: "emoji",
        ref: "🍒",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "n2",
      target_id: "n20",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đếm cách 2",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng các bước đếm cách 2",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt bước đếm cách 2 với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đếm cách 2",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đếm cách 2 và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template:
      "Bé hãy chọn số tiếp theo khi đếm nhảy cách 2 nhé: {label}!",
    narration_template: "Chúng mình cùng đếm cách 2: 2, 4, 6, 8, 10 nhé",
  },
  ordering: ["n2", "n4", "n6", "n8", "n10", "n12", "n14", "n16", "n18", "n20"],
};

export const C1_CNT_10_SEED: SkillSeed = {
  identity: C1_CNT_10_IDENTITY,
  dataset: C1_CNT_10_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
    },
    {
      code: "GL-C1-CNT-STEP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-STEP-0020",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CDW-ORD-0009",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CDW-ORD-0010",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      access_tier: "free",
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-FLS-0008",
      template: "GT-012",
      band: "5-6",
      difficulty: 2,
      access_tier: "login",
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-FLS-0010",
      template: "GT-012",
      band: "5-6",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-SLOT-0121",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "food",
      rounds: 2,
      montessori_ref: "WB02-D1",
    },
    {
      code: "GL-C1-CNT-SLOT-0122",
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "food",
      rounds: 2,
      montessori_ref: "WB02-D1",
    },
  ],
};
