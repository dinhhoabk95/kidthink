import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRD_02_IDENTITY: SkillIdentity = {
  code: "C5.WRD.02",
  strand_code: "C5.WRD",
  competency_code: "C5",
  name: "Đọc tiếng quen thuộc",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["recall", "match"],
  tier: "advanced",
  prerequisites: ["C5.ALP.06", "C5.LET.05"],
  learning_objectives: [
    {
      code: "LO-C5.WRD.02-01",
      behaviour: "Nhận biết và thực hành Đọc tiếng quen thuộc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRD.02-02",
      behaviour: "Vận dụng Đọc tiếng quen thuộc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRD.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đọc tiếng quen thuộc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRD_02_DATASET: SkillDataset = {
  skill_code: "C5.WRD.02",
  concept_label: "Đọc tiếng quen thuộc",
  surface: "game",
  items: [
    {
      id: "wrd_hoa",
      label: "từ hoa",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "tiếng viết",
      },
    },
    {
      id: "wrd_la",
      label: "từ lá",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "tiếng viết",
      },
    },
    {
      id: "wrd_qua",
      label: "từ quả",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "tiếng viết",
      },
    },
    {
      id: "wrd_chim",
      label: "từ chim",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "tiếng viết",
      },
    },
    {
      id: "wrd_cay",
      label: "từ cây",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "tiếng viết",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đọc tiếng quen thuộc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc tiếng quen thuộc",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đọc tiếng quen thuộc nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["wrd_hoa", "wrd_la", "wrd_qua", "wrd_chim", "wrd_cay"],
};

export const C5_WRD_02_SEED: SkillSeed = {
  identity: C5_WRD_02_IDENTITY,
  dataset: C5_WRD_02_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-TAP-0003",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-TAP-0004",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-TCMP-0003",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-TCMP-0004",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-PATT-0003",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-PATT-0004",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SLOT-0001",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SLOT-0002",
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SIZE-0001",
      template: "GT-009",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-SIZE-0002",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
