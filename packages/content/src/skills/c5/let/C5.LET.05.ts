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
      label: "chữ r",
      glyph: "r",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_s",
      label: "chữ s",
      glyph: "s",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_t",
      label: "chữ t",
      glyph: "t",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_v",
      label: "chữ v",
      glyph: "v",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "let_x",
      label: "chữ x",
      glyph: "x",
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
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["let_r", "let_s", "let_t", "let_v", "let_x"],
};

export const C5_LET_05_SEED: SkillSeed = {
  identity: C5_LET_05_IDENTITY,
  dataset: C5_LET_05_DATASET,
  levels: [],
};
