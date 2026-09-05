import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_03_IDENTITY: SkillIdentity = {
  code: "C5.RHY.03",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Đọc đồng dao có vần",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "recall"],
  tier: "core",
  prerequisites: ["C5.RHY.01"],
  learning_objectives: [
    {
      code: "LO-C5.RHY.03-01",
      behaviour: "Nhận biết và thực hành Đọc đồng dao có vần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RHY.03-02",
      behaviour: "Vận dụng Đọc đồng dao có vần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RHY.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đọc đồng dao có vần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RHY_03_DATASET: SkillDataset = {
  skill_code: "C5.RHY.03",
  concept_label: "Đọc đồng dao có vần",
  surface: "game",
  items: [
    {
      id: "let_â",
      label: "chữ â",
      glyph: "â",
      image: {
        kind: "emoji",
        ref: "🅰️",
      },
      contrast_group: "primary",
    },
    {
      id: "let_b",
      label: "chữ b",
      glyph: "b",
      image: {
        kind: "emoji",
        ref: "🅱️",
      },
      contrast_group: "contrast",
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đọc đồng dao có vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc đồng dao có vần",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đọc đồng dao có vần nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_â", "let_b", "let_c", "let_d", "let_đ"],
};

export const C5_RHY_03_SEED: SkillSeed = {
  identity: C5_RHY_03_IDENTITY,
  dataset: C5_RHY_03_DATASET,
  levels: [
    {
      code: "GL-C5-RHY-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PUZZ-0005",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PUZZ-0006",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-BOND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-BOND-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
  ],
};
