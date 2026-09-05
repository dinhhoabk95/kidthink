import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_LIS_03_IDENTITY: SkillIdentity = {
  code: "C5.LIS.03",
  strand_code: "C5.LIS",
  competency_code: "C5",
  name: "Nghe theo trình tự nhiều bước",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "sequence", "recall"],
  tier: "advanced",
  prerequisites: ["C5.LIS.02"],
  learning_objectives: [
    {
      code: "LO-C5.LIS.03-01",
      behaviour:
        "Nhận biết và thực hành Nghe theo trình tự nhiều bước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.LIS.03-02",
      behaviour:
        "Vận dụng Nghe theo trình tự nhiều bước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.LIS.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nghe theo trình tự nhiều bước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_LIS_03_DATASET: SkillDataset = {
  skill_code: "C5.LIS.03",
  concept_label: "Nghe theo trình tự nhiều bước",
  surface: "game",
  items: [
    {
      id: "chair",
      label: "cái ghế",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ dùng",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe theo trình tự nhiều bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe theo trình tự nhiều bước",
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
      "Chúng mình cùng tìm hiểu về Nghe theo trình tự nhiều bước nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C5_LIS_03_SEED: SkillSeed = {
  identity: C5_LIS_03_IDENTITY,
  dataset: C5_LIS_03_DATASET,
  levels: [
    {
      code: "GL-C5-LIS-AUDIO-0021",
      template: "GT-018",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-LIS-AUDIO-0023",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-LIS-PATT-0003",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-PATT-0004",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SLOT-0003",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
