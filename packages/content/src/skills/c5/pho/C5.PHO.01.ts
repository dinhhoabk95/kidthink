import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PHO_01_IDENTITY: SkillIdentity = {
  code: "C5.PHO.01",
  strand_code: "C5.PHO",
  competency_code: "C5",
  name: "Nghe ra từng tiếng trong câu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "sequence"],
  tier: "core",
  prerequisites: ["C5.LIS.01"],
  learning_objectives: [
    {
      code: "LO-C5.PHO.01-01",
      behaviour:
        "Nhận biết và thực hành Nghe ra từng tiếng trong câu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PHO.01-02",
      behaviour:
        "Vận dụng Nghe ra từng tiếng trong câu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PHO.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nghe ra từng tiếng trong câu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PHO_01_DATASET: SkillDataset = {
  skill_code: "C5.PHO.01",
  concept_label: "Nghe ra từng tiếng trong câu",
  surface: "game",
  items: [
    {
      id: "let_k",
      label: "chữ k",
      glyph: "k",
      image: {
        kind: "emoji",
        ref: "🅺",
      },
      contrast_group: "primary",
    },
    {
      id: "let_l",
      label: "chữ l",
      glyph: "l",
      image: {
        kind: "emoji",
        ref: "🅻",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_m",
      label: "chữ m",
      glyph: "m",
      image: {
        kind: "emoji",
        ref: "🅼",
      },
      contrast_group: "primary",
    },
    {
      id: "let_n",
      label: "chữ n",
      glyph: "n",
      image: {
        kind: "emoji",
        ref: "🅽",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_o",
      label: "chữ o",
      glyph: "o",
      image: {
        kind: "emoji",
        ref: "🅾️",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe ra từng tiếng trong câu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe ra từng tiếng trong câu",
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
      "Chúng mình cùng tìm hiểu về Nghe ra từng tiếng trong câu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_k", "let_l", "let_m", "let_n", "let_o"],
};

export const C5_PHO_01_SEED: SkillSeed = {
  identity: C5_PHO_01_IDENTITY,
  dataset: C5_PHO_01_DATASET,
  levels: [
    {
      code: "GL-C5-PHO-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-MAZE-0003",
      template: "GT-013",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-BOND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-BOND-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-MTRX-0001",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-PHO-MTRX-0002",
      template: "GT-023",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
  ],
};
