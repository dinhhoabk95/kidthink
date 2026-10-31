import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_BOK_05_IDENTITY: SkillIdentity = {
  code: "C5.BOK.05",
  strand_code: "C5.BOK",
  competency_code: "C5",
  name: "Tìm thông tin trong sách tranh",
  age_min: 5,
  age_max: 6,
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
      id: "bok_nhan_vat_chinh",
      label: "nhân vật chính",
      image: {
        kind: "emoji",
        ref: "👧",
      },
      category: {
        type: "nhân vật tranh",
        label: "Nhân vật trong tranh",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "bok_trang_phuc",
      label: "trang phục bé",
      image: {
        kind: "emoji",
        ref: "👗",
      },
      category: {
        type: "nhân vật tranh",
        label: "Nhân vật trong tranh",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "bok_cam_xuc",
      label: "nụ cười bé",
      image: {
        kind: "emoji",
        ref: "😊",
      },
      category: {
        type: "nhân vật tranh",
        label: "Nhân vật trong tranh",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "bok_canh_vat",
      label: "cây cối xanh",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "cảnh vật tranh",
        label: "Cảnh vật trong tranh",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "bok_ngoi_nha",
      label: "ngôi nhà xinh",
      image: {
        kind: "emoji",
        ref: "🏡",
      },
      category: {
        type: "cảnh vật tranh",
        label: "Cảnh vật trong tranh",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "bok_thoi_tiet",
      label: "đám mây trắng",
      image: {
        kind: "emoji",
        ref: "⛅",
      },
      category: {
        type: "cảnh vật tranh",
        label: "Cảnh vật trong tranh",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "bok_nhan_vat_chinh",
      target_id: "bok_trang_phuc",
      explanation: "cùng là chi tiết nhân vật",
    },
    {
      type: "pair",
      source_id: "bok_canh_vat",
      target_id: "bok_ngoi_nha",
      explanation: "cùng là chi tiết cảnh vật",
    },
    {
      type: "contrast",
      source_id: "bok_nhan_vat_chinh",
      target_id: "bok_canh_vat",
      explanation: "nhân vật đối lập với cảnh vật",
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
  },
  ordering: [
    "bok_nhan_vat_chinh",
    "bok_trang_phuc",
    "bok_cam_xuc",
    "bok_canh_vat",
    "bok_ngoi_nha",
    "bok_thoi_tiet",
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
  ],
};
