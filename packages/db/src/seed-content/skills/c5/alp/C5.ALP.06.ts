import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_06_IDENTITY: SkillIdentity = {
  code: "C5.ALP.06",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Âm của chữ",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["listen", "match"],
  tier: "advanced",
  prerequisites: ["C5.ALP.04", "C5.PHO.04"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.06-01",
      behaviour: "Nhận biết và thực hành Âm của chữ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.06-02",
      behaviour: "Vận dụng Âm của chữ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Âm của chữ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_06_DATASET: SkillDataset = {
  skill_code: "C5.ALP.06",
  concept_label: "Âm của chữ",
  surface: "game",
  items: [
    {
      id: "let_e",
      label: "chữ e",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ê",
      label: "chữ ê",
      glyph: "ê",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_g",
      label: "chữ g",
      glyph: "g",
      image: {
        kind: "emoji",
        ref: "🅶",
      },
      contrast_group: "primary",
    },
    {
      id: "let_h",
      label: "chữ h",
      glyph: "h",
      image: {
        kind: "emoji",
        ref: "🅷",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_i",
      label: "chữ i",
      glyph: "i",
      image: {
        kind: "emoji",
        ref: "🅸",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Âm của chữ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Âm của chữ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Âm của chữ nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_e", "let_ê", "let_g", "let_h", "let_i"],
};

export const C5_ALP_06_SEED: SkillSeed = {
  identity: C5_ALP_06_IDENTITY,
  dataset: C5_ALP_06_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
