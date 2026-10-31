import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_01_IDENTITY: SkillIdentity = {
  code: "C5.ALP.01",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Chữ khác hình, khác số",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["compare", "sort"],
  tier: "basic",
  prerequisites: ["C4.DET.02", "C5.LET.01"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.01-01",
      behaviour: "Nhận biết và thực hành Chữ khác hình, khác số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.01-02",
      behaviour: "Vận dụng Chữ khác hình, khác số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chữ khác hình, khác số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_01_DATASET: SkillDataset = {
  skill_code: "C5.ALP.01",
  concept_label: "Chữ khác hình, khác số",
  surface: "game",
  items: [
    {
      id: "let_a",
      label: "chữ a",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "chữ cái đơn",
        label: "Chữ cái",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "let_b",
      label: "chữ b",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "chữ cái đơn",
        label: "Chữ cái",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "let_c",
      label: "chữ c",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      category: {
        type: "chữ cái đơn",
        label: "Chữ cái",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "sym_so_1",
      label: "chữ số một",
      glyph: "1",
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
      category: {
        type: "số và hình",
        label: "Số và hình",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "sym_so_2",
      label: "chữ số hai",
      glyph: "2",
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
      category: {
        type: "số và hình",
        label: "Số và hình",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "sym_hinh_tron",
      label: "hình tròn",
      glyph: "○",
      image: {
        kind: "emoji",
        ref: "⭕",
      },
      category: {
        type: "số và hình",
        label: "Số và hình",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  axes: {
    category: {
      values: ["chữ cái đơn", "số và hình"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "let_a",
      target_id: "sym_so_1",
      explanation: "Chữ cái đối lập với chữ số",
    },
    {
      type: "contrast",
      source_id: "let_b",
      target_id: "sym_so_2",
      explanation: "Chữ cái đối lập với chữ số",
    },
    {
      type: "contrast",
      source_id: "let_c",
      target_id: "sym_hinh_tron",
      explanation: "Chữ cái đối lập với hình vẽ",
    },
    {
      type: "pair",
      source_id: "let_a",
      target_id: "let_b",
      explanation: "Cùng là chữ cái đơn",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ khác hình, khác số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ khác hình, khác số",
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
      "Chúng mình cùng tìm hiểu về Chữ khác hình, khác số nhé",
  },
  ordering: [
    "let_a",
    "let_b",
    "let_c",
    "sym_so_1",
    "sym_so_2",
    "sym_hinh_tron",
  ],
};

export const C5_ALP_01_SEED: SkillSeed = {
  identity: C5_ALP_01_IDENTITY,
  dataset: C5_ALP_01_DATASET,
  levels: [
    {
      code: "GL-C5-ALP-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
