import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_02_IDENTITY: SkillIdentity = {
  code: "C5.ALP.02",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Nhận mặt chữ trong tên mình",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: ["C5.ALP.01"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.02-01",
      behaviour:
        "Nhận biết và thực hành Nhận mặt chữ trong tên mình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.02-02",
      behaviour:
        "Vận dụng Nhận mặt chữ trong tên mình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhận mặt chữ trong tên mình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_02_DATASET: SkillDataset = {
  skill_code: "C5.ALP.02",
  concept_label: "Nhận mặt chữ trong tên mình",
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
        type: "chữ cái nhóm 1",
        label: "Chữ cái nhóm 1",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "let_b",
      label: "chữ b (con bướm)",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "chữ cái nhóm 1",
        label: "Chữ cái nhóm 1",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "let_c",
      label: "chữ c (con cua)",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🦀",
      },
      category: {
        type: "chữ cái nhóm 1",
        label: "Chữ cái nhóm 1",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "let_d",
      label: "chữ d (con dê)",
      glyph: "d",
      image: {
        kind: "emoji",
        ref: "🐐",
      },
      category: {
        type: "chữ cái nhóm 2",
        label: "Chữ cái nhóm 2",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "let_đ",
      label: "chữ đ (quả đào)",
      glyph: "đ",
      image: {
        kind: "emoji",
        ref: "🍑",
      },
      category: {
        type: "chữ cái nhóm 2",
        label: "Chữ cái nhóm 2",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
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
        type: "chữ cái nhóm 2",
        label: "Chữ cái nhóm 2",
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
      target_id: "let_b",
      explanation: "Cùng thuộc nhóm chữ cái quen thuộc",
    },
    {
      type: "pair",
      source_id: "let_c",
      target_id: "let_d",
      explanation: "Cùng thuộc nhóm chữ cái quen thuộc",
    },
    {
      type: "contrast",
      source_id: "let_a",
      target_id: "let_d",
      explanation: "Khác nhóm chữ cái",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhận mặt chữ trong tên mình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận mặt chữ trong tên mình",
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
      "Chúng mình cùng tìm hiểu về Nhận mặt chữ trong tên mình nhé",
  },
  ordering: ["let_a", "let_b", "let_c", "let_d", "let_đ", "let_e"],
};

export const C5_ALP_02_SEED: SkillSeed = {
  identity: C5_ALP_02_IDENTITY,
  dataset: C5_ALP_02_DATASET,
  levels: [
    {
      code: "GL-C5-ALP-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-ALP-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
  ],
};
