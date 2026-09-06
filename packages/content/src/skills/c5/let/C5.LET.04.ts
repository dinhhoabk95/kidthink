import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_LET_04_IDENTITY: SkillIdentity = {
  code: "C5.LET.04",
  strand_code: "C5.LET",
  competency_code: "C5",
  name: "Nhận biết k · l · m · n · p · q",
  age_min: 5,
  age_max: 5,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "core",
  prerequisites: ["C5.LET.03"],
  learning_objectives: [
    {
      code: "LO-C5.LET.04-01",
      behaviour:
        "Nhận biết và thực hành Nhận biết k · l · m · n · p · q ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.LET.04-02",
      behaviour:
        "Phân biệt và so sánh Nhận biết k · l · m · n · p · q trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.LET.04-03",
      behaviour: "Vận dụng và ghi nhớ Nhận biết k · l · m · n · p · q",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_LET_04_DATASET: SkillDataset = {
  skill_code: "C5.LET.04",
  concept_label: "Nhận biết k · l · m · n · p · q",
  surface: "game",
  items: [
    {
      id: "let_k",
      label: "chữ k",
      glyph: "k",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_l",
      label: "chữ l",
      glyph: "l",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_m",
      label: "chữ m",
      glyph: "m",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_n",
      label: "chữ n",
      glyph: "n",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_p",
      label: "chữ p",
      glyph: "p",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_q",
      label: "chữ q",
      glyph: "q",
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
      description: "Làm quen cơ bản với Nhận biết k · l · m · n · p · q",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận biết k · l · m · n · p · q",
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
      "Chúng mình cùng tìm hiểu về Nhận biết k · l · m · n · p · q nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["let_k", "let_l", "let_m", "let_n", "let_p", "let_q"],
};

export const C5_LET_04_SEED: SkillSeed = {
  identity: C5_LET_04_IDENTITY,
  dataset: C5_LET_04_DATASET,
  levels: [],
};
