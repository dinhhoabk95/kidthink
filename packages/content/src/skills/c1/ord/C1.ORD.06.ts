import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ORD_06_IDENTITY: SkillIdentity = {
  code: "C1.ORD.06",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Thứ tự ngược từ cuối lên",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["sequence", "shift"],
  tier: "advanced",
  prerequisites: ["C1.ORD.04", "C1.CNT.04"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.06-01",
      behaviour: "Nhận biết và thực hành Thứ tự ngược từ cuối lên ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.06-02",
      behaviour: "Vận dụng Thứ tự ngược từ cuối lên trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thứ tự ngược từ cuối lên",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_06_DATASET: SkillDataset = {
  skill_code: "C1.ORD.06",
  concept_label: "Thứ tự ngược từ cuối lên",
  surface: "game",
  items: [
    {
      id: "bowl",
      label: "cái bát",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "spoon",
      label: "cái thìa",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "cup",
      label: "cái cốc",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "bed",
      label: "cái giường",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "đồ dùng",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Thứ tự ngược từ cuối lên",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thứ tự ngược từ cuối lên",
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
      "Chúng mình cùng tìm hiểu về Thứ tự ngược từ cuối lên nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bowl", "spoon", "cup", "bed", "chair"],
};

export const C1_ORD_06_SEED: SkillSeed = {
  identity: C1_ORD_06_IDENTITY,
  dataset: C1_ORD_06_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-SORT-0009",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SORT-0010",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SORT-0011",
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SORT-0012",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0019",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0020",
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0021",
      template: "GT-008",
      band: "5-6",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SLOT-0022",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PUZZ-0001",
      template: "GT-010",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PUZZ-0002",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PUZZ-0003",
      template: "GT-010",
      band: "5-6",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PUZZ-0004",
      template: "GT-010",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-MAZE-0001",
      template: "GT-013",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-MAZE-0002",
      template: "GT-013",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-MAZE-0003",
      template: "GT-013",
      band: "5-6",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-MAZE-0004",
      template: "GT-013",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-BAL-0001",
      template: "GT-016",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-BAL-0002",
      template: "GT-016",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-BAL-0003",
      template: "GT-016",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-BAL-0004",
      template: "GT-016",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
  ],
};
