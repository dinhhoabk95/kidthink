import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ALP_03_IDENTITY: SkillIdentity = {
  code: "C5.ALP.03",
  strand_code: "C5.ALP",
  competency_code: "C5",
  name: "Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "match"],
  tier: "core",
  prerequisites: ["C5.ALP.01"],
  learning_objectives: [
    {
      code: "LO-C5.ALP.03-01",
      behaviour:
        "Nhận biết và thực hành Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ALP.03-02",
      behaviour:
        "Vận dụng Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ALP.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ALP_03_DATASET: SkillDataset = {
  skill_code: "C5.ALP.03",
  concept_label: "Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y",
  surface: "game",
  items: [
    {
      id: "let_c",
      label: "chữ c",
      glyph: "c",
      image: {
        kind: "emoji",
        ref: "🅲",
      },
      contrast_group: "primary",
    },
    {
      id: "let_d",
      label: "chữ d",
      glyph: "d",
      image: {
        kind: "emoji",
        ref: "🅳",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_đ",
      label: "chữ đ",
      glyph: "đ",
      image: {
        kind: "emoji",
        ref: "🅳",
      },
      contrast_group: "primary",
    },
    {
      id: "let_e",
      label: "chữ e",
      glyph: "e",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_ê",
      label: "chữ ê",
      glyph: "ê",
      image: {
        kind: "emoji",
        ref: "🅴",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description:
        "Làm quen cơ bản với Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y",
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
      "Chúng mình cùng tìm hiểu về Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_c", "let_d", "let_đ", "let_e", "let_ê"],
};

export const C5_ALP_03_SEED: SkillSeed = {
  identity: C5_ALP_03_IDENTITY,
  dataset: C5_ALP_03_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
