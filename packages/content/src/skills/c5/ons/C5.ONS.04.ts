import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ONS_04_IDENTITY: SkillIdentity = {
  code: "C5.ONS.04",
  strand_code: "C5.ONS",
  competency_code: "C5",
  name: "Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["listen", "compare"],
  tier: "advanced",
  prerequisites: ["C5.ONS.03"],
  learning_objectives: [
    {
      code: "LO-C5.ONS.04-01",
      behaviour:
        "Nhận biết và thực hành Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ONS.04-02",
      behaviour:
        "Phân biệt và so sánh Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ONS.04-03",
      behaviour:
        "Vận dụng và ghi nhớ Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ONS_04_DATASET: SkillDataset = {
  skill_code: "C5.ONS.04",
  concept_label: "Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh",
  surface: "game",
  items: [
    {
      id: "ons_ph",
      label: "âm ph",
      glyph: "ph",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_r",
      label: "âm r",
      glyph: "r",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_s",
      label: "âm s",
      glyph: "s",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_t",
      label: "âm t",
      glyph: "t",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_th",
      label: "âm th",
      glyph: "th",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_tr",
      label: "âm tr",
      glyph: "tr",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_v",
      label: "âm v",
      glyph: "v",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_x",
      label: "âm x",
      glyph: "x",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_ch",
      label: "âm ch",
      glyph: "ch",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_kh",
      label: "âm kh",
      glyph: "kh",
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
      description:
        "Làm quen cơ bản với Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh",
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
      "Chúng mình cùng tìm hiểu về Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "ons_ph",
    "ons_r",
    "ons_s",
    "ons_t",
    "ons_th",
    "ons_tr",
    "ons_v",
    "ons_x",
    "ons_ch",
    "ons_kh",
  ],
};

export const C5_ONS_04_SEED: SkillSeed = {
  identity: C5_ONS_04_IDENTITY,
  dataset: C5_ONS_04_DATASET,
  levels: [],
};
