import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_BOK_05_IDENTITY: SkillIdentity = {
  code: "C5.BOK.05",
  strand_code: "C5.BOK",
  competency_code: "C5",
  name: "Tìm thông tin trong sách tranh",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["observe", "infer"],
  tier: "advanced",
  prerequisites: ["C5.BOK.04", "C5.PRN.02"],
  learning_objectives: [
    {
      code: "LO-C5.BOK.05-01",
      behaviour:
        "Nhận biết và thực hành Tìm thông tin trong sách tranh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.BOK.05-02",
      behaviour:
        "Vận dụng Tìm thông tin trong sách tranh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.BOK.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm thông tin trong sách tranh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_BOK_05_DATASET: SkillDataset = {
  skill_code: "C5.BOK.05",
  concept_label: "Tìm thông tin trong sách tranh",
  surface: "game",
  items: [
    {
      id: "bok_tim_nhan_vat",
      label: "tìm nhân vật trong tranh",
      image: {
        kind: "emoji",
        ref: "🔍",
      },
      category: {
        type: "tìm thông tin",
      },
    },
    {
      id: "bok_tim_hanh_dong",
      label: "tìm hành động của nhân vật",
      image: {
        kind: "emoji",
        ref: "🏃",
      },
      category: {
        type: "tìm thông tin",
      },
    },
    {
      id: "bok_tim_do_vat",
      label: "tìm đồ vật ẩn trong tranh",
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "tìm thông tin",
      },
    },
    {
      id: "bok_tim_thoi_tiet",
      label: "quan sát thời tiết trong tranh",
      image: {
        kind: "emoji",
        ref: "⛅",
      },
      category: {
        type: "tìm thông tin",
      },
    },
    {
      id: "bok_tim_cam_xuc",
      label: "nhận biết cảm xúc nhân vật",
      image: {
        kind: "emoji",
        ref: "😊",
      },
      category: {
        type: "tìm thông tin",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm thông tin trong sách tranh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm thông tin trong sách tranh",
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
      "Chúng mình cùng tìm hiểu về Tìm thông tin trong sách tranh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "bok_tim_nhan_vat",
    "bok_tim_hanh_dong",
    "bok_tim_do_vat",
    "bok_tim_thoi_tiet",
    "bok_tim_cam_xuc",
  ],
};

export const C5_BOK_05_SEED: SkillSeed = {
  identity: C5_BOK_05_IDENTITY,
  dataset: C5_BOK_05_DATASET,
  levels: [
    {
      code: "GL-C5-BOK-TAP-0005",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-TAP-0006",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-TCNT-0001",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-TCNT-0002",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-TCMP-0005",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-TCMP-0006",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-PAIR-0003",
      template: "GT-004",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-PAIR-0004",
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-PATT-0005",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-PATT-0006",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
  ],
};
