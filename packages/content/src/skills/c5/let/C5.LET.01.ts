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
      label: "chữ a",
      glyph: "a",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_e",
      label: "chữ e",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_i",
      label: "chữ i",
      glyph: "i",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_o",
      label: "chữ o",
      glyph: "o",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_u",
      label: "chữ u",
      glyph: "u",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_y",
      label: "chữ y",
      glyph: "y",
      image: {
        kind: "emoji",
        ref: "📝",
      },
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
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["let_a", "let_e", "let_i", "let_o", "let_u", "let_y"],
};

export const C5_LET_01_SEED: SkillSeed = {
  identity: C5_LET_01_IDENTITY,
  dataset: C5_LET_01_DATASET,
  levels: [],
};
