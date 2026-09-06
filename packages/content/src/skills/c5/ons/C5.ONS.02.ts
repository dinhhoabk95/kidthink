import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ONS_02_IDENTITY: SkillIdentity = {
  code: "C5.ONS.02",
  strand_code: "C5.ONS",
  competency_code: "C5",
  name: "Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["listen", "match"],
  tier: "core",
  prerequisites: ["C5.ONS.01"],
  learning_objectives: [
    {
      code: "LO-C5.ONS.02-01",
      behaviour:
        "Nhận biết và thực hành Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ONS.02-02",
      behaviour:
        "Phân biệt và so sánh Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ONS.02-03",
      behaviour:
        "Vận dụng và ghi nhớ Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ONS_02_DATASET: SkillDataset = {
  skill_code: "C5.ONS.02",
  concept_label: "Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h",
  surface: "game",
  items: [
    {
      id: "ons_b",
      label: "âm b",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_c_k_q",
      label: "âm c (c, k, q)",
      glyph: "c/k/q",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_d_gi",
      label: "âm d (d, gi)",
      glyph: "d/gi",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_đ",
      label: "âm đ",
      glyph: "đ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_g_gh",
      label: "âm g (g, gh)",
      glyph: "g/gh",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_h",
      label: "âm h",
      glyph: "h",
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
        "Làm quen cơ bản với Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h",
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
      "Chúng mình cùng tìm hiểu về Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["ons_b", "ons_c_k_q", "ons_d_gi", "ons_đ", "ons_g_gh", "ons_h"],
};

export const C5_ONS_02_SEED: SkillSeed = {
  identity: C5_ONS_02_IDENTITY,
  dataset: C5_ONS_02_DATASET,
  levels: [],
};
