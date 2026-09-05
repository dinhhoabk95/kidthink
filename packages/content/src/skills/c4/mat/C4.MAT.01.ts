import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_01_IDENTITY: SkillIdentity = {
  code: "C4.MAT.01",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Thời tiết trong ngày",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe", "sort"],
  tier: "basic",
  prerequisites: ["C4.DET.01"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.01-01",
      behaviour: "Nhận biết và thực hành Thời tiết trong ngày ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.01-02",
      behaviour: "Vận dụng Thời tiết trong ngày trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thời tiết trong ngày",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_01_DATASET: SkillDataset = {
  skill_code: "C4.MAT.01",
  concept_label: "Thời tiết trong ngày",
  surface: "game",
  items: [
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
    {
      id: "dog",
      label: "con chó",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "động vật",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Thời tiết trong ngày",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thời tiết trong ngày",
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
    narration_template: "Chúng mình cùng tìm hiểu về Thời tiết trong ngày nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C4_MAT_01_SEED: SkillSeed = {
  identity: C4_MAT_01_IDENTITY,
  dataset: C4_MAT_01_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
