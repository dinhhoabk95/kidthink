import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_01_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.01",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Dài ngắn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: ["C1.CMP.06", "C1.CMP.07"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.01-01",
      behaviour: "Nhận biết và thực hành Dài ngắn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.01-02",
      behaviour: "Vận dụng Dài ngắn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Dài ngắn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_01_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.01",
  concept_label: "Dài ngắn",
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
      description: "Làm quen cơ bản với Dài ngắn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dài ngắn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Dài ngắn nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["apple", "banana", "watermelon", "carrot", "corn"],
};

export const C1_MEAS_01_SEED: SkillSeed = {
  identity: C1_MEAS_01_IDENTITY,
  dataset: C1_MEAS_01_DATASET,
  levels: [
    {
      code: "GL-C1-BAL-SCL-0034",
      template: "GT-014",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-BAL-SCL-0035",
      template: "GT-014",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-BAL-SCL-0036",
      template: "GT-014",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-MSR-UNIT-0001",
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D5-04",
    },
    {
      code: "GL-C1-MSR-UNIT-0002",
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D5-04",
    },
    {
      code: "GL-C1-MSR-UNIT-0003",
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D5-04",
    },
    {
      code: "GL-C1-MSR-UNIT-0004",
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D5-04",
    },
    {
      code: "GL-C1-MSR-UNIT-0005",
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D5-04",
    },
    {
      code: "GL-C1-MEAS-LEN-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-LEN-0002",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-SZO-ORD-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D5-06",
    },
    {
      code: "GL-C1-SZO-ORD-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D5-06",
    },
    {
      code: "GL-C1-SZO-ORD-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D5-06",
    },
    {
      code: "GL-C1-SZO-ORD-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D5-06",
    },
    {
      code: "GL-C1-RUL-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D5-05",
    },
    {
      code: "GL-C1-RUL-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D5-05",
    },
  ],
};
