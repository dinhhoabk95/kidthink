import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_07_IDENTITY: SkillIdentity = {
  code: "C5.PHO.07",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Ghép âm đầu với vần thành tiếng",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["listen", "solve"],
  tier: "advanced",
  prerequisites: ["C5.PHO.06"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.07-01",
      behaviour:
        "Nhận biết và thực hành Ghép âm đầu với vần thành tiếng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.07-02",
      behaviour:
        "Vận dụng Ghép âm đầu với vần thành tiếng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Ghép âm đầu với vần thành tiếng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_07_DATASET: SkillDataset = {
  skill_code: "C5.PHO.07",
  concept_label: "Ghép âm đầu với vần thành tiếng",
  surface: "game",
  items: [
    {
      id: "let_ơ",
      label: "chữ ơ",
      glyph: "ơ",
      image: {
        kind: "emoji",
        ref: "🅾️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_p",
      label: "chữ p",
      glyph: "p",
      image: {
        kind: "emoji",
        ref: "🅿️",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_q",
      label: "chữ q",
      glyph: "q",
      image: {
        kind: "emoji",
        ref: "🆀",
      },
      contrast_group: "primary",
    },
    {
      id: "let_r",
      label: "chữ r",
      glyph: "r",
      image: {
        kind: "emoji",
        ref: "🆁",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_s",
      label: "chữ s",
      glyph: "s",
      image: {
        kind: "emoji",
        ref: "🆂",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ghép âm đầu với vần thành tiếng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghép âm đầu với vần thành tiếng",
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
      "Chúng mình cùng tìm hiểu về Ghép âm đầu với vần thành tiếng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_ơ", "let_p", "let_q", "let_r", "let_s"],
};

export const C5_PHO_07_SEED: SkillSeed = {
  identity: C5_PHO_07_IDENTITY,
  dataset: C5_PHO_07_DATASET,
  levels: [
    {
      code: "GL-C5-PHO-PICT-0001",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-PICT-0002",
      template: "GT-031",
      band: "5-6",
      difficulty: 5,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-PICT-0003",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-PICT-0004",
      template: "GT-031",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-PICT-0005",
      template: "GT-031",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-FRAC-0006",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-FRAC-0007",
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-FRAC-0008",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-FRAC-0009",
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-FRAC-0010",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
  ],
};
