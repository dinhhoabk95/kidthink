import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_01_IDENTITY: SkillIdentity = {
  code: "C5.VOC.01",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng động vật",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.01-01",
      behaviour: "Nhận biết và thực hành Từ vựng động vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.01-02",
      behaviour: "Vận dụng Từ vựng động vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Từ vựng động vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_01_DATASET: SkillDataset = {
  skill_code: "C5.VOC.01",
  concept_label: "Từ vựng động vật",
  surface: "game",
  items: [
    {
      id: "voc_cho",
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
      id: "voc_meo",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "voc_ga",
      label: "con gà",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "voc_vit",
      label: "con vịt",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "voc_lon",
      label: "con lợn",
      image: {
        kind: "emoji",
        ref: "🐷",
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
      description: "Làm quen cơ bản với Từ vựng động vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng động vật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Từ vựng động vật nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["voc_cho", "voc_meo", "voc_ga", "voc_vit", "voc_lon"],
};

export const C5_VOC_01_SEED: SkillSeed = {
  identity: C5_VOC_01_IDENTITY,
  dataset: C5_VOC_01_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-PRB-0006",
      template: "GT-018",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-WRD-PRB-0007",
      template: "GT-018",
      band: "5-6",
      difficulty: 1,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-WRD-PRB-0008",
      template: "GT-018",
      band: "5-6",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-WRD-PRB-0009",
      template: "GT-018",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-WRD-PRB-0010",
      template: "GT-018",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-VOC-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
