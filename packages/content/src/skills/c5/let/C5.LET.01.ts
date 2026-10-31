import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_LET_01_IDENTITY: SkillIdentity = {
  code: "C5.LET.01",
  strand_code: "C5.LET",
  competency_code: "C5",
  name: "Nhận biết a · e · i · o · u · y",
  age_min: 4,
  age_max: 4,
  difficulty: 1,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.LET.01-01",
      behaviour:
        "Nhận biết và thực hành Nhận biết a · e · i · o · u · y ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.LET.01-02",
      behaviour:
        "Phân biệt và so sánh Nhận biết a · e · i · o · u · y trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.LET.01-03",
      behaviour: "Vận dụng và ghi nhớ Nhận biết a · e · i · o · u · y",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_LET_01_DATASET: SkillDataset = {
  skill_code: "C5.LET.01",
  concept_label: "Nhận biết a · e · i · o · u · y",
  surface: "game",
  items: [
    {
      id: "let_a",
      label: "chữ a (con cá)",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "nguyên âm nhóm 1",
        label: "Nguyên âm nhóm 1",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "let_e",
      label: "chữ e (em bé)",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "👶",
      },
      category: {
        type: "nguyên âm nhóm 1",
        label: "Nguyên âm nhóm 1",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "let_i",
      label: "chữ i (chú chim)",
      glyph: "i",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "nguyên âm nhóm 1",
        label: "Nguyên âm nhóm 1",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "let_o",
      label: "chữ o (con ong)",
      glyph: "o",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "nguyên âm nhóm 2",
        label: "Nguyên âm nhóm 2",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "let_u",
      label: "chữ u (chim cú)",
      glyph: "u",
      image: {
        kind: "emoji",
        ref: "🦉",
      },
      category: {
        type: "nguyên âm nhóm 2",
        label: "Nguyên âm nhóm 2",
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
        type: "nguyên âm nhóm 2",
        label: "Nguyên âm nhóm 2",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "let_a",
      target_id: "let_e",
      explanation: "cùng là nguyên âm nhóm một",
    },
    {
      type: "pair",
      source_id: "let_o",
      target_id: "let_u",
      explanation: "cùng là nguyên âm nhóm hai",
    },
    {
      type: "contrast",
      source_id: "let_a",
      target_id: "let_o",
      explanation: "khác nhóm nguyên âm",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhận biết a · e · i · o · u · y",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận biết a · e · i · o · u · y",
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
      "Chúng mình cùng tìm hiểu về Nhận biết a · e · i · o · u · y nhé",
  },
  ordering: ["let_a", "let_e", "let_i", "let_o", "let_u", "let_y"],
};

export const C5_LET_01_SEED: SkillSeed = {
  identity: C5_LET_01_IDENTITY,
  dataset: C5_LET_01_DATASET,
  levels: [
    {
      code: "GL-C5-LET-INTRO-0001",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.LET.01"],
    },
    {
      code: "GL-C5-LET-TAP-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-TAP-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-TAP-0003",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-MULTI-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-LET-HUNT-0003",
      template: "GT-037",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
  ],
};
