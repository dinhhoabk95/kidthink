import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_VIS_02_IDENTITY: SkillIdentity = {
  code: "C4.VIS.02",
  strand_code: "C4.VIS",
  competency_code: "C4",
  name: "Tìm vật giống nhau trong nhóm",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.VIS.02-01",
      behaviour:
        "Nhận biết và thực hành Tìm vật giống nhau trong nhóm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.VIS.02-02",
      behaviour:
        "Vận dụng Tìm vật giống nhau trong nhóm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.VIS.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm vật giống nhau trong nhóm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_VIS_02_DATASET: SkillDataset = {
  skill_code: "C4.VIS.02",
  concept_label: "Tìm vật giống nhau trong nhóm",
  surface: "game",
  items: [
    {
      id: "spoon",
      label: "cái thìa",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "cup",
      label: "cái cốc",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "đồ dùng",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm vật giống nhau trong nhóm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm vật giống nhau trong nhóm",
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
      "Chúng mình cùng tìm hiểu về Tìm vật giống nhau trong nhóm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

export const C4_VIS_02_SEED: SkillSeed = {
  identity: C4_VIS_02_IDENTITY,
  dataset: C4_VIS_02_DATASET,
  levels: [
    {
      code: "GL-C4-VIS-CARD-0101",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      montessori_ref: "WB03-D1",
    },
    {
      code: "GL-C4-VIS-CARD-0102",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
      montessori_ref: "WB03-D1",
    },
    {
      code: "GL-C4-VIS-MATCH-0104",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
      montessori_ref: "WB03-D2",
    },
    {
      code: "GL-C4-VIS-MATCH-0105",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      montessori_ref: "WB03-D2",
    },
    {
      code: "GL-C4-HID-SHP-0006",
      template: "GT-022",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D2-08",
    },
    {
      code: "GL-C4-HID-SHP-0007",
      template: "GT-022",
      band: "5-6",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D2-08",
    },
    {
      code: "GL-C4-HID-SHP-0008",
      template: "GT-022",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D2-08",
    },
    {
      code: "GL-C4-HID-SHP-0009",
      template: "GT-022",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D2-08",
    },
    {
      code: "GL-C4-HID-SHP-0010",
      template: "GT-022",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D2-08",
    },
  ],
};
