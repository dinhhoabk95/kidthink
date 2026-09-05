import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_VIS_04_IDENTITY: SkillIdentity = {
  code: "C4.VIS.04",
  strand_code: "C4.VIS",
  competency_code: "C4",
  name: "Tìm hình bị che một phần",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["observe", "infer"],
  tier: "advanced",
  prerequisites: ["C4.VIS.03"],
  learning_objectives: [
    {
      code: "LO-C4.VIS.04-01",
      behaviour: "Nhận biết và thực hành Tìm hình bị che một phần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.VIS.04-02",
      behaviour: "Vận dụng Tìm hình bị che một phần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.VIS.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm hình bị che một phần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_VIS_04_DATASET: SkillDataset = {
  skill_code: "C4.VIS.04",
  concept_label: "Tìm hình bị che một phần",
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
      description: "Làm quen cơ bản với Tìm hình bị che một phần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm hình bị che một phần",
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
      "Chúng mình cùng tìm hiểu về Tìm hình bị che một phần nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["bed", "chair", "apple", "banana", "watermelon"],
};

export const C4_VIS_04_SEED: SkillSeed = {
  identity: C4_VIS_04_IDENTITY,
  dataset: C4_VIS_04_DATASET,
  levels: [
    {
      code: "GL-C4-OBS-CARD-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-DIF-CMP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-DIF-CMP-0013",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-DIF-CMP-0017",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-PIC-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D6-04",
    },
    {
      code: "GL-C4-PIC-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D6-04",
    },
    {
      code: "GL-C4-HID-OBJ-0001",
      template: "GT-022",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D6-06",
    },
    {
      code: "GL-C4-HID-OBJ-0002",
      template: "GT-022",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D6-06",
    },
    {
      code: "GL-C4-HID-OBJ-0003",
      template: "GT-022",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D6-06",
    },
    {
      code: "GL-C4-HID-OBJ-0004",
      template: "GT-022",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D6-06",
    },
    {
      code: "GL-C4-HID-OBJ-0005",
      template: "GT-022",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D6-06",
    },
    {
      code: "GL-C4-VIS-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-VIS-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-VIS-TCMP-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-VIS-TCMP-0006",
      template: "GT-003",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-VIS-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-VIS-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-VIS-PATT-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-VIS-PATT-0006",
      template: "GT-005",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
  ],
};
