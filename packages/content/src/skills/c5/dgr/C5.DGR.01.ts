import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DGR_01_IDENTITY: SkillIdentity = {
  code: "C5.DGR.01",
  strand_code: "C5.DGR",
  competency_code: "C5",
  name: "Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu",
  age_min: 6,
  age_max: 7,
  difficulty: 3,
  thinking_processes: ["observe", "match"],
  tier: "advanced",
  prerequisites: ["C5.LET.05"],
  learning_objectives: [
    {
      code: "LO-C5.DGR.01-01",
      behaviour:
        "Nhận biết và thực hành Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DGR.01-02",
      behaviour:
        "Phân biệt và so sánh Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DGR.01-03",
      behaviour:
        "Vận dụng và ghi nhớ Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DGR_01_DATASET: SkillDataset = {
  skill_code: "C5.DGR.01",
  concept_label: "Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu",
  surface: "game",
  items: [
    {
      id: "dgr_ch",
      label: "chữ ch",
      glyph: "ch",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "dgr_gh",
      label: "chữ gh",
      glyph: "gh",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "dgr_gi",
      label: "chữ gi",
      glyph: "gi",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "dgr_kh",
      label: "chữ kh",
      glyph: "kh",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "dgr_nh",
      label: "chữ nh",
      glyph: "nh",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "dgr_ph",
      label: "chữ ph",
      glyph: "ph",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "dgr_th",
      label: "chữ th",
      glyph: "th",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "dgr_tr",
      label: "chữ tr",
      glyph: "tr",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "dgr_qu",
      label: "chữ qu",
      glyph: "qu",
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
        "Làm quen cơ bản với Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu",
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
      "Chúng mình cùng tìm hiểu về Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "dgr_ch",
    "dgr_gh",
    "dgr_gi",
    "dgr_kh",
    "dgr_nh",
    "dgr_ph",
    "dgr_th",
    "dgr_tr",
    "dgr_qu",
  ],
};

export const C5_DGR_01_SEED: SkillSeed = {
  identity: C5_DGR_01_IDENTITY,
  dataset: C5_DGR_01_DATASET,
  levels: [],
};
