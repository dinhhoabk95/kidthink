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
      label: "sách động vật",
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "sách khám phá",
        label: "Sách khám phá",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "bok_sach_xe_co",
      label: "sách xe cộ",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "sách khám phá",
        label: "Sách khám phá",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "bok_sach_vu_tru",
      label: "sách vũ trụ",
      image: {
        kind: "emoji",
        ref: "🚀",
      },
      category: {
        type: "sách khám phá",
        label: "Sách khám phá",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "bok_sach_co_tich",
      label: "sách cổ tích",
      image: {
        kind: "emoji",
        ref: "🧚",
      },
      category: {
        type: "sách truyện kể",
        label: "Sách truyện kể",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "bok_sach_khung_long",
      label: "sách khủng long",
      image: {
        kind: "emoji",
        ref: "🦖",
      },
      category: {
        type: "sách truyện kể",
        label: "Sách truyện kể",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "bok_sach_ngu_ngon",
      label: "sách ngụ ngôn",
      image: {
        kind: "emoji",
        ref: "🦊",
      },
      category: {
        type: "sách truyện kể",
        label: "Sách truyện kể",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "bok_sach_dong_vat",
      target_id: "bok_sach_xe_co",
      explanation: "cùng là sách khám phá khoa học",
    },
    {
      type: "pair",
      source_id: "bok_sach_co_tich",
      target_id: "bok_sach_khung_long",
      explanation: "cùng là sách truyện kể tưởng tượng",
    },
    {
      type: "contrast",
      source_id: "bok_sach_dong_vat",
      target_id: "bok_sach_co_tich",
      explanation: "sách khám phá đối lập với sách truyện kể",
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
  },
  ordering: [
    "bok_sach_dong_vat",
    "bok_sach_xe_co",
    "bok_sach_vu_tru",
    "bok_sach_co_tich",
    "bok_sach_khung_long",
    "bok_sach_ngu_ngon",
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
      code: "GL-C5-BOK-SHAD-0005",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
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
  ],
};
