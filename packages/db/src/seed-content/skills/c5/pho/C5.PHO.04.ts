import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_04_IDENTITY: SkillIdentity = {
  code: "C5.PHO.04",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Nghe ra âm đầu của tiếng",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "compare"],
  tier: "advanced",
  prerequisites: ["C5.PHO.02"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.04-01",
      behaviour: "Nhận biết và thực hành Nghe ra âm đầu của tiếng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.04-02",
      behaviour: "Vận dụng Nghe ra âm đầu của tiếng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nghe ra âm đầu của tiếng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_04_DATASET: SkillDataset = {
  skill_code: "C5.PHO.04",
  concept_label: "Nghe ra âm đầu của tiếng",
  surface: "game",
  items: [
    {
      id: "let_n",
      label: "chữ n",
      glyph: "n",
      image: {
        kind: "emoji",
        ref: "🅽",
      },
      contrast_group: "primary",
    },
    {
      id: "let_o",
      label: "chữ o",
      glyph: "o",
      image: {
        kind: "emoji",
        ref: "🅾️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_ô",
      label: "chữ ô",
      glyph: "ô",
      image: {
        kind: "emoji",
        ref: "🅾️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_ơ",
      label: "chữ ơ",
      glyph: "ơ",
      image: {
        kind: "emoji",
        ref: "🅾️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_p",
      label: "chữ p",
      glyph: "p",
      image: {
        kind: "emoji",
        ref: "🅿️",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe ra âm đầu của tiếng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe ra âm đầu của tiếng",
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
      "Chúng mình cùng tìm hiểu về Nghe ra âm đầu của tiếng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_n", "let_o", "let_ô", "let_ơ", "let_p"],
};

export const C5_PHO_04_SEED: SkillSeed = {
  identity: C5_PHO_04_IDENTITY,
  dataset: C5_PHO_04_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
