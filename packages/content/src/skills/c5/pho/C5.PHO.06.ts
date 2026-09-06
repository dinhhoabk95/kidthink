import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_06_IDENTITY: SkillIdentity = {
  code: "C5.PHO.06",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Tách tiếng thành âm đầu và vần",
  age_min: 6,
  age_max: 7,
  difficulty: 5,
  thinking_processes: ["listen", "deduce"],
  tier: "advanced",
  prerequisites: ["C5.PHO.04", "C5.RHY.02", "C5.ONS.03"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.06-01",
      behaviour:
        "Nhận biết và thực hành Tách tiếng thành âm đầu và vần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.06-02",
      behaviour:
        "Vận dụng Tách tiếng thành âm đầu và vần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tách tiếng thành âm đầu và vần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_06_DATASET: SkillDataset = {
  skill_code: "C5.PHO.06",
  concept_label: "Tách tiếng thành âm đầu và vần",
  surface: "game",
  items: [
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
    {
      id: "let_q",
      label: "chữ q",
      glyph: "q",
      image: {
        kind: "emoji",
        ref: "🆀",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_r",
      label: "chữ r",
      glyph: "r",
      image: {
        kind: "emoji",
        ref: "🆁",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tách tiếng thành âm đầu và vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tách tiếng thành âm đầu và vần",
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
      "Chúng mình cùng tìm hiểu về Tách tiếng thành âm đầu và vần nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_ô", "let_ơ", "let_p", "let_q", "let_r"],
};

export const C5_PHO_06_SEED: SkillSeed = {
  identity: C5_PHO_06_IDENTITY,
  dataset: C5_PHO_06_DATASET,
  levels: [
    {
      code: "GL-C5-PHO-FRAC-0001",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-FRAC-0002",
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-FRAC-0003",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-FRAC-0004",
      template: "GT-034",
      band: "5-6",
      difficulty: 5,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-FRAC-0005",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TAP-0011",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TAP-0012",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-TAP-0013",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
  ],
};
