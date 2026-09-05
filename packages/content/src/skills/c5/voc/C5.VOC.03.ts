import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_03_IDENTITY: SkillIdentity = {
  code: "C5.VOC.03",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng nghề nghiệp",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["match", "infer"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.03-01",
      behaviour: "Nhận biết và thực hành Từ vựng nghề nghiệp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.03-02",
      behaviour: "Vận dụng Từ vựng nghề nghiệp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Từ vựng nghề nghiệp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_03_DATASET: SkillDataset = {
  skill_code: "C5.VOC.03",
  concept_label: "Từ vựng nghề nghiệp",
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
      description: "Làm quen cơ bản với Từ vựng nghề nghiệp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng nghề nghiệp",
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
    narration_template: "Chúng mình cùng tìm hiểu về Từ vựng nghề nghiệp nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["chair", "apple", "banana", "watermelon", "carrot"],
};

export const C5_VOC_03_SEED: SkillSeed = {
  identity: C5_VOC_03_IDENTITY,
  dataset: C5_VOC_03_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
  ],
};
