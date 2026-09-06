import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ONS_03_IDENTITY: SkillIdentity = {
  code: "C5.ONS.03",
  strand_code: "C5.ONS",
  competency_code: "C5",
  name: "Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["listen", "match"],
  tier: "advanced",
  prerequisites: ["C5.ONS.02"],
  learning_objectives: [
    {
      code: "LO-C5.ONS.03-01",
      behaviour:
        "Nhận biết và thực hành Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ONS.03-02",
      behaviour:
        "Phân biệt và so sánh Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ONS.03-03",
      behaviour:
        "Vận dụng và ghi nhớ Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ONS_03_DATASET: SkillDataset = {
  skill_code: "C5.ONS.03",
  concept_label: "Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p",
  surface: "game",
  items: [
    {
      id: "ons_l",
      label: "âm l",
      glyph: "l",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_m",
      label: "âm m",
      glyph: "m",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_n",
      label: "âm n",
      glyph: "n",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_ng_ngh",
      label: "âm ng (ng, ngh)",
      glyph: "ng/ngh",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_nh",
      label: "âm nh",
      glyph: "nh",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_p",
      label: "âm p",
      glyph: "p",
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
        "Làm quen cơ bản với Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p",
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
      "Chúng mình cùng tìm hiểu về Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["ons_l", "ons_m", "ons_n", "ons_ng_ngh", "ons_nh", "ons_p"],
};

export const C5_ONS_03_SEED: SkillSeed = {
  identity: C5_ONS_03_IDENTITY,
  dataset: C5_ONS_03_DATASET,
  levels: [],
};
