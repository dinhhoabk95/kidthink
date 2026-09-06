import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_GRM_02_IDENTITY: SkillIdentity = {
  code: "C5.GRM.02",
  strand_code: "C5.GRM",
  competency_code: "C5",
  name: "Trật tự từ trong câu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sequence", "verify"],
  tier: "advanced",
  prerequisites: ["C5.GRM.01", "C3.SEQ.01"],
  learning_objectives: [
    {
      code: "LO-C5.GRM.02-01",
      behaviour: "Nhận biết và thực hành Trật tự từ trong câu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.GRM.02-02",
      behaviour: "Vận dụng Trật tự từ trong câu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.GRM.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Trật tự từ trong câu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_GRM_02_DATASET: SkillDataset = {
  skill_code: "C5.GRM.02",
  concept_label: "Trật tự từ trong câu",
  surface: "game",
  items: [
    {
      id: "grm_ai_lam_gi",
      label: "bé đang đọc sách",
      image: {
        kind: "emoji",
        ref: "📖",
      },
      category: {
        type: "trật tự từ",
      },
    },
    {
      id: "grm_ai_an_gi",
      label: "mèo con ăn cá",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "trật tự từ",
      },
    },
    {
      id: "grm_ai_uong_gi",
      label: "em bé uống sữa",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "trật tự từ",
      },
    },
    {
      id: "grm_ai_di_dau",
      label: "bố mẹ đi làm",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "trật tự từ",
      },
    },
    {
      id: "grm_ai_choi_gi",
      label: "các bạn chơi bóng",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "trật tự từ",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Trật tự từ trong câu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trật tự từ trong câu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trật tự từ trong câu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "grm_ai_lam_gi",
    "grm_ai_an_gi",
    "grm_ai_uong_gi",
    "grm_ai_di_dau",
    "grm_ai_choi_gi",
  ],
};

export const C5_GRM_02_SEED: SkillSeed = {
  identity: C5_GRM_02_IDENTITY,
  dataset: C5_GRM_02_DATASET,
  levels: [
    {
      code: "GL-C5-GRM-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SLOT-0002",
      template: "GT-008",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-MAZE-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-MAZE-0002",
      template: "GT-013",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-BAL-0001",
      template: "GT-016",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-BAL-0002",
      template: "GT-016",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-BOND-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-BOND-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
  ],
};
