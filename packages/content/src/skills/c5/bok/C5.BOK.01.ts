import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_BOK_01_IDENTITY: SkillIdentity = {
  code: "C5.BOK.01",
  strand_code: "C5.BOK",
  competency_code: "C5",
  name: "Bìa · trang · tên truyện",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.BOK.01-01",
      behaviour: "Nhận biết và thực hành Bìa · trang · tên truyện ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.BOK.01-02",
      behaviour: "Vận dụng Bìa · trang · tên truyện trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.BOK.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Bìa · trang · tên truyện",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_BOK_01_DATASET: SkillDataset = {
  skill_code: "C5.BOK.01",
  concept_label: "Bìa · trang · tên truyện",
  surface: "game",
  items: [
    {
      id: "bok_bia_sach",
      label: "bìa sách",
      image: {
        kind: "emoji",
        ref: "📕",
      },
      category: {
        type: "cấu tạo sách",
      },
    },
    {
      id: "bok_gay_sach",
      label: "gáy sách",
      image: {
        kind: "emoji",
        ref: "📙",
      },
      category: {
        type: "cấu tạo sách",
      },
    },
    {
      id: "bok_trang_sach",
      label: "trang sách",
      image: {
        kind: "emoji",
        ref: "📄",
      },
      category: {
        type: "cấu tạo sách",
      },
    },
    {
      id: "bok_ten_sach",
      label: "tên cuốn sách",
      image: {
        kind: "emoji",
        ref: "🏷️",
      },
      category: {
        type: "cấu tạo sách",
      },
    },
    {
      id: "bok_tac_gia",
      label: "tác giả viết sách",
      image: {
        kind: "emoji",
        ref: "✍️",
      },
      category: {
        type: "cấu tạo sách",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Bìa · trang · tên truyện",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Bìa · trang · tên truyện",
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
      "Chúng mình cùng tìm hiểu về Bìa · trang · tên truyện nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "bok_bia_sach",
    "bok_gay_sach",
    "bok_trang_sach",
    "bok_ten_sach",
    "bok_tac_gia",
  ],
};

export const C5_BOK_01_SEED: SkillSeed = {
  identity: C5_BOK_01_IDENTITY,
  dataset: C5_BOK_01_DATASET,
  levels: [
    {
      code: "GL-C5-BOK-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
