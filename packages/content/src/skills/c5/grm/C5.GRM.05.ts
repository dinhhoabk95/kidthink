import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_GRM_05_IDENTITY: SkillIdentity = {
  code: "C5.GRM.05",
  strand_code: "C5.GRM",
  competency_code: "C5",
  name: "Từ chỉ vị trí, từ chỉ số nhiều",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["describe", "match"],
  tier: "advanced",
  prerequisites: ["C5.GRM.01", "C2.ORI.07"],
  learning_objectives: [
    {
      code: "LO-C5.GRM.05-01",
      behaviour:
        "Nhận biết và thực hành Từ chỉ vị trí, từ chỉ số nhiều ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.GRM.05-02",
      behaviour:
        "Vận dụng Từ chỉ vị trí, từ chỉ số nhiều trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.GRM.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Từ chỉ vị trí, từ chỉ số nhiều",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_GRM_05_DATASET: SkillDataset = {
  skill_code: "C5.GRM.05",
  concept_label: "Từ chỉ vị trí, từ chỉ số nhiều",
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
      description: "Làm quen cơ bản với Từ chỉ vị trí, từ chỉ số nhiều",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ chỉ vị trí, từ chỉ số nhiều",
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
      "Chúng mình cùng tìm hiểu về Từ chỉ vị trí, từ chỉ số nhiều nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C5_GRM_05_SEED: SkillSeed = {
  identity: C5_GRM_05_IDENTITY,
  dataset: C5_GRM_05_DATASET,
  levels: [
    {
      code: "GL-C5-GRM-TAP-0003",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-TAP-0004",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-TCMP-0001",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-TCMP-0002",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-PATT-0003",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-PATT-0004",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SLOT-0003",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-PUZZ-0003",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-PUZZ-0004",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
