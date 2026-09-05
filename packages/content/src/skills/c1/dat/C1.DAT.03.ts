import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_DAT_03_IDENTITY: SkillIdentity = {
  code: "C1.DAT.03",
  strand_code: "C1.DAT",
  competency_code: "C1",
  name: "So cột cao – thấp",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: ["C1.DAT.02", "C1.CMP.08"],
  learning_objectives: [
    {
      code: "LO-C1.DAT.03-01",
      behaviour: "Nhận biết và thực hành So cột cao – thấp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.DAT.03-02",
      behaviour: "Vận dụng So cột cao – thấp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.DAT.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới So cột cao – thấp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_DAT_03_DATASET: SkillDataset = {
  skill_code: "C1.DAT.03",
  concept_label: "So cột cao – thấp",
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
      description: "Làm quen cơ bản với So cột cao – thấp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng So cột cao – thấp",
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
    narration_template: "Chúng mình cùng tìm hiểu về So cột cao – thấp nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C1_DAT_03_SEED: SkillSeed = {
  identity: C1_DAT_03_IDENTITY,
  dataset: C1_DAT_03_DATASET,
  levels: [
    {
      code: "GL-C1-DAT-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0011",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TAP-0012",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0010",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0011",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCNT-0012",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0009",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0010",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0011",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-TCMP-0012",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0007",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PAIR-0008",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0006",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0007",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-DAT-PATT-0008",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
