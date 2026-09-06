import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_04_IDENTITY: SkillIdentity = {
  code: "C5.VOC.04",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng gia đình",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.04-01",
      behaviour: "Nhận biết và thực hành Từ vựng gia đình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.04-02",
      behaviour: "Vận dụng Từ vựng gia đình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Từ vựng gia đình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_04_DATASET: SkillDataset = {
  skill_code: "C5.VOC.04",
  concept_label: "Từ vựng gia đình",
  surface: "game",
  items: [
    {
      id: "voc_ong",
      label: "ông",
      image: {
        kind: "emoji",
        ref: "👴",
      },
      category: {
        type: "gia đình",
      },
    },
    {
      id: "voc_ba",
      label: "bà",
      image: {
        kind: "emoji",
        ref: "👵",
      },
      category: {
        type: "gia đình",
      },
    },
    {
      id: "voc_bo",
      label: "bố",
      image: {
        kind: "emoji",
        ref: "👨",
      },
      category: {
        type: "gia đình",
      },
    },
    {
      id: "voc_me",
      label: "mẹ",
      image: {
        kind: "emoji",
        ref: "👩",
      },
      category: {
        type: "gia đình",
      },
    },
    {
      id: "voc_be",
      label: "em bé",
      image: {
        kind: "emoji",
        ref: "👶",
      },
      category: {
        type: "gia đình",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Từ vựng gia đình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng gia đình",
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
    narration_template: "Chúng mình cùng tìm hiểu về Từ vựng gia đình nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["voc_ong", "voc_ba", "voc_bo", "voc_me", "voc_be"],
};

export const C5_VOC_04_SEED: SkillSeed = {
  identity: C5_VOC_04_IDENTITY,
  dataset: C5_VOC_04_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0008",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TCMP-0007",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TCMP-0008",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-PATT-0007",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-PATT-0008",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-SLOT-0005",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-SLOT-0006",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MEMO-0005",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MEMO-0006",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
  ],
};
