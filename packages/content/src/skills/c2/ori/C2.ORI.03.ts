import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_03_IDENTITY: SkillIdentity = {
  code: "C2.ORI.03",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Trên",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.ORI.03-01",
      behaviour: "Nhận biết và thực hành Trên ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.03-02",
      behaviour: "Vận dụng Trên trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Trên",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_03_DATASET: SkillDataset = {
  skill_code: "C2.ORI.03",
  concept_label: "Trên",
  surface: "game",
  items: [
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Trên",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trên",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trên nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C2_ORI_03_SEED: SkillSeed = {
  identity: C2_ORI_03_IDENTITY,
  dataset: C2_ORI_03_DATASET,
  levels: [
    {
      code: "GL-C2-ORI-POS-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-POS-0002",
      template: "GT-022",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCMP-0005",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCMP-0006",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-SLOT-0005",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-SLOT-0006",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-MEMO-0005",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-MEMO-0006",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
