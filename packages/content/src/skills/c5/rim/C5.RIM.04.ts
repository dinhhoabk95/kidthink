import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RIM_04_IDENTITY: SkillIdentity = {
  code: "C5.RIM.04",
  strand_code: "C5.RIM",
  competency_code: "C5",
  name: "Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["observe", "sort"],
  tier: "advanced",
  prerequisites: ["C5.RIM.03"],
  learning_objectives: [
    {
      code: "LO-C5.RIM.04-01",
      behaviour:
        "Nhận biết và thực hành Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RIM.04-02",
      behaviour:
        "Phân biệt và so sánh Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RIM.04-03",
      behaviour:
        "Vận dụng và ghi nhớ Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RIM_04_DATASET: SkillDataset = {
  skill_code: "C5.RIM.04",
  concept_label: "Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp",
  surface: "game",
  items: [
    {
      id: "rim_ac",
      label: "vần ac",
      glyph: "ac",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ăc",
      label: "vần ăc",
      glyph: "ăc",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_âc",
      label: "vần âc",
      glyph: "âc",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_at",
      label: "vần at",
      glyph: "at",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ăt",
      label: "vần ăt",
      glyph: "ăt",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ât",
      label: "vần ât",
      glyph: "ât",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ap",
      label: "vần ap",
      glyph: "ap",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_ăp",
      label: "vần ăp",
      glyph: "ăp",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "rim_âp",
      label: "vần âp",
      glyph: "âp",
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
        "Làm quen cơ bản với Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp",
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
      "Chúng mình cùng tìm hiểu về Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "rim_ac",
    "rim_ăc",
    "rim_âc",
    "rim_at",
    "rim_ăt",
    "rim_ât",
    "rim_ap",
    "rim_ăp",
    "rim_âp",
  ],
};

export const C5_RIM_04_SEED: SkillSeed = {
  identity: C5_RIM_04_IDENTITY,
  dataset: C5_RIM_04_DATASET,
  levels: [],
};
