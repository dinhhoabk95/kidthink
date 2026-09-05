import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ORD_02_IDENTITY: SkillIdentity = {
  code: "C1.ORD.02",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Đầu · giữa · cuối hàng",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "sequence"],
  tier: "basic",
  prerequisites: ["C2.ORI.05", "C2.ORI.06"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.02-01",
      behaviour: "Nhận biết và thực hành Đầu · giữa · cuối hàng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.02-02",
      behaviour: "Vận dụng Đầu · giữa · cuối hàng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đầu · giữa · cuối hàng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_02_DATASET: SkillDataset = {
  skill_code: "C1.ORD.02",
  concept_label: "Đầu · giữa · cuối hàng",
  surface: "game",
  items: [
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
    {
      id: "cat",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
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
      description: "Làm quen cơ bản với Đầu · giữa · cuối hàng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đầu · giữa · cuối hàng",
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
      "Chúng mình cùng tìm hiểu về Đầu · giữa · cuối hàng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C1_ORD_02_SEED: SkillSeed = {
  identity: C1_ORD_02_IDENTITY,
  dataset: C1_ORD_02_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0008",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0008",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0007",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCMP-0008",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PATT-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-PATT-0004",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
  ],
};
