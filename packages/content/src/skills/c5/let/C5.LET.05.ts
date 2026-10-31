import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_LET_05_IDENTITY: SkillIdentity = {
  code: "C5.LET.05",
  strand_code: "C5.LET",
  competency_code: "C5",
  name: "Nhận biết r · s · t · v · x",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "recall"],
  tier: "core",
  prerequisites: ["C5.LET.04"],
  learning_objectives: [
    {
      code: "LO-C5.LET.05-01",
      behaviour:
        "Nhận biết và thực hành Nhận biết r · s · t · v · x ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.LET.05-02",
      behaviour:
        "Phân biệt và so sánh Nhận biết r · s · t · v · x trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.LET.05-03",
      behaviour: "Vận dụng và ghi nhớ Nhận biết r · s · t · v · x",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_LET_05_DATASET: SkillDataset = {
  skill_code: "C5.LET.05",
  concept_label: "Nhận biết r · s · t · v · x",
  surface: "game",
  items: [
    {
      id: "let_r",
      label: "chữ r (con rùa)",
      glyph: "r",
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      category: {
        type: "phụ âm nhóm 1",
        label: "Phụ âm nhóm 1",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "let_s",
      label: "chữ s (sóc nâu)",
      glyph: "s",
      image: {
        kind: "emoji",
        ref: "🐿️",
      },
      category: {
        type: "phụ âm nhóm 1",
        label: "Phụ âm nhóm 1",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "let_t",
      label: "chữ t (trái táo)",
      glyph: "t",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "phụ âm nhóm 1",
        label: "Phụ âm nhóm 1",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "let_v",
      label: "chữ v (con voi)",
      glyph: "v",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "phụ âm nhóm 2",
        label: "Phụ âm nhóm 2",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "let_x",
      label: "chữ x (xe đạp)",
      glyph: "x",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "phụ âm nhóm 2",
        label: "Phụ âm nhóm 2",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "let_y",
      label: "chữ y (y tá)",
      glyph: "y",
      image: {
        kind: "emoji",
        ref: "🩺",
      },
      category: {
        type: "phụ âm nhóm 2",
        label: "Phụ âm nhóm 2",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "let_r",
      target_id: "let_s",
      explanation: "cùng là phụ âm nhóm một",
    },
    {
      type: "pair",
      source_id: "let_v",
      target_id: "let_x",
      explanation: "cùng là phụ âm nhóm hai",
    },
    {
      type: "contrast",
      source_id: "let_r",
      target_id: "let_v",
      explanation: "khác nhóm phụ âm",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhận biết r · s · t · v · x",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận biết r · s · t · v · x",
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
      "Chúng mình cùng tìm hiểu về Nhận biết r · s · t · v · x nhé",
  },
  ordering: ["let_r", "let_s", "let_t", "let_v", "let_x", "let_y"],
};

export const C5_LET_05_SEED: SkillSeed = {
  identity: C5_LET_05_IDENTITY,
  dataset: C5_LET_05_DATASET,
  levels: [
    {
      code: "GL-C5-LET-INTRO-0005",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.LET.05"],
    },
    {
      code: "GL-C5-LET-TAP-0021",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-TAP-0022",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0021",
      template: "GT-002",
      band: "5-6",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
