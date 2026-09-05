import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_07_IDENTITY: SkillIdentity = {
  code: "C2.ORI.07",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Trong",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.ORI.07-01",
      behaviour: "Nhận biết và thực hành Trong ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.07-02",
      behaviour: "Vận dụng Trong trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.07-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Trong",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_07_DATASET: SkillDataset = {
  skill_code: "C2.ORI.07",
  concept_label: "Trong",
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
      description: "Làm quen cơ bản với Trong",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trong",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trong nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C2_ORI_07_SEED: SkillSeed = {
  identity: C2_ORI_07_IDENTITY,
  dataset: C2_ORI_07_DATASET,
  levels: [
    {
      code: "GL-C2-POS-LOC-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-POS-LOC-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-CMP-SIZ-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-POS-LOC-0014",
      template: "GT-022",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-SUB-FAST-0019",
      template: "GT-012",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-POS-LOC-0020",
      template: "GT-022",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-TRANS-0021",
      template: "GT-019",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D2-04",
    },
    {
      code: "GL-C2-ROT-TRANS-0022",
      template: "GT-019",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D2-04",
    },
    {
      code: "GL-C2-ROT-TRANS-0023",
      template: "GT-019",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D2-04",
    },
    {
      code: "GL-C2-BLK-STK-0033",
      template: "GT-017",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-BLK-STK-0034",
      template: "GT-017",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-BLK-STK-0035",
      template: "GT-017",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D6-10",
    },
    {
      code: "GL-C2-ORI-TCMP-0013",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCMP-0014",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-PATT-0011",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-PATT-0012",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-SLOT-0013",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-SLOT-0014",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-MEMO-0013",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
