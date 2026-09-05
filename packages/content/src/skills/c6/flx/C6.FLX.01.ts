import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_FLX_01_IDENTITY: SkillIdentity = {
  code: "C6.FLX.01",
  strand_code: "C6.FLX",
  competency_code: "C6",
  name: "Đổi luật giữa vòng chơi",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["shift"],
  tier: "advanced",
  prerequisites: ["C3.CLS.06"],
  learning_objectives: [
    {
      code: "LO-C6.FLX.01-01",
      behaviour: "Nhận biết và thực hành Đổi luật giữa vòng chơi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.FLX.01-02",
      behaviour: "Vận dụng Đổi luật giữa vòng chơi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.FLX.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đổi luật giữa vòng chơi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_FLX_01_DATASET: SkillDataset = {
  skill_code: "C6.FLX.01",
  concept_label: "Đổi luật giữa vòng chơi",
  surface: "game",
  items: [
    {
      id: "apple",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "banana",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
      },
    },
    {
      id: "corn",
      label: "bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "rau củ",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đổi luật giữa vòng chơi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đổi luật giữa vòng chơi",
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
      "Chúng mình cùng tìm hiểu về Đổi luật giữa vòng chơi nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C6_FLX_01_SEED: SkillSeed = {
  identity: C6_FLX_01_IDENTITY,
  dataset: C6_FLX_01_DATASET,
  levels: [
    {
      code: "GL-C6-FLX-SWT-0033",
      template: "GT-027",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-SWT-0034",
      template: "GT-027",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-SWT-0035",
      template: "GT-027",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-BLG-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D4-07",
    },
    {
      code: "GL-C3-BLG-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D4-07",
    },
    {
      code: "GL-C3-MUL-BSK-0003",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D4-04",
    },
    {
      code: "GL-C3-MUL-BSK-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D4-04",
    },
    {
      code: "GL-C3-MUL-BSK-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D4-04",
    },
    {
      code: "GL-C6-FLX-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-PUZZ-0003",
      template: "GT-010",
      band: "4-5",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-PUZZ-0004",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-ADD-0001",
      template: "GT-026",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-ADD-0002",
      template: "GT-026",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-ADD-0003",
      template: "GT-026",
      band: "4-5",
      difficulty: 5,
      theme: "nature",
      rounds: 3,
    },
  ],
};
