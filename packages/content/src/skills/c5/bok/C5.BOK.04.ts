import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_BOK_04_IDENTITY: SkillIdentity = {
  code: "C5.BOK.04",
  strand_code: "C5.BOK",
  competency_code: "C5",
  name: "Chọn sách mình thích và nói vì sao",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["describe", "plan"],
  tier: "core",
  prerequisites: ["C5.BOK.03"],
  learning_objectives: [
    {
      code: "LO-C5.BOK.04-01",
      behaviour:
        "Nhận biết và thực hành Chọn sách mình thích và nói vì sao ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.BOK.04-02",
      behaviour:
        "Vận dụng Chọn sách mình thích và nói vì sao trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.BOK.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn sách mình thích và nói vì sao",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_BOK_04_DATASET: SkillDataset = {
  skill_code: "C5.BOK.04",
  concept_label: "Chọn sách mình thích và nói vì sao",
  surface: "game",
  items: [
    {
      id: "bok_sach_dong_vat",
      label: "cuốn sách về các loài động vật",
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "chọn sách",
      },
    },
    {
      id: "bok_sach_phuong_tien",
      label: "cuốn sách về xe cộ và tàu bay",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "chọn sách",
      },
    },
    {
      id: "bok_sach_co_tich",
      label: "cuốn sách truyện cổ tích thần tiên",
      image: {
        kind: "emoji",
        ref: "🧚",
      },
      category: {
        type: "chọn sách",
      },
    },
    {
      id: "bok_sach_vu_tru",
      label: "cuốn sách về các vì sao vũ trụ",
      image: {
        kind: "emoji",
        ref: "🚀",
      },
      category: {
        type: "chọn sách",
      },
    },
    {
      id: "bok_sach_khung_long",
      label: "cuốn sách về thế giới khủng long",
      image: {
        kind: "emoji",
        ref: "🦖",
      },
      category: {
        type: "chọn sách",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chọn sách mình thích và nói vì sao",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn sách mình thích và nói vì sao",
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
      "Chúng mình cùng tìm hiểu về Chọn sách mình thích và nói vì sao nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "bok_sach_dong_vat",
    "bok_sach_phuong_tien",
    "bok_sach_co_tich",
    "bok_sach_vu_tru",
    "bok_sach_khung_long",
  ],
};

export const C5_BOK_04_SEED: SkillSeed = {
  identity: C5_BOK_04_IDENTITY,
  dataset: C5_BOK_04_DATASET,
  levels: [
    {
      code: "GL-C5-BOK-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-SHAD-0006",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-SIZE-0004",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-MAZE-0003",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-MAZE-0004",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-HIDE-0002",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
  ],
};
