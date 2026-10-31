import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_07_IDENTITY: SkillIdentity = {
  code: "C5.WRT.07",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Viết chữ cái trong ô li",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["create", "verify"],
  tier: "advanced",
  prerequisites: ["C5.WRT.06", "C5.ALP.04"],
  learning_objectives: [
    {
      code: "LO-C5.WRT.07-01",
      behaviour: "Nhận biết và thực hành Viết chữ cái trong ô li ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.07-02",
      behaviour: "Vận dụng Viết chữ cái trong ô li trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Viết chữ cái trong ô li",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_07_DATASET: SkillDataset = {
  skill_code: "C5.WRT.07",
  concept_label: "Viết chữ cái trong ô li",
  surface: "game",
  items: [
    {
      id: "wrt_o_li_vuong",
      label: "ô li vuông",
      image: {
        kind: "emoji",
        ref: "🔲",
      },
      category: {
        type: "dòng ô li",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "wrt_duong_ke_ngang",
      label: "đường kẻ ngang",
      image: {
        kind: "emoji",
        ref: "➖",
      },
      category: {
        type: "dòng ô li",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "wrt_duong_ke_doc",
      label: "đường kẻ dọc",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "dòng ô li",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "wrt_diem_dat_but",
      label: "điểm đặt bút",
      image: {
        kind: "emoji",
        ref: "📍",
      },
      category: {
        type: "dòng ô li",
      },
      value: 4,
      contrast_group: "primary",
    },
    {
      id: "wrt_do_cao_chu",
      label: "chiều cao chữ",
      image: {
        kind: "emoji",
        ref: "📊",
      },
      category: {
        type: "viết chữ đẹp",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "wrt_khoang_cach_chu",
      label: "khoảng cách chữ",
      image: {
        kind: "emoji",
        ref: "↔️",
      },
      category: {
        type: "viết chữ đẹp",
      },
      value: 6,
      contrast_group: "contrast",
    },
    {
      id: "wrt_dung_but",
      label: "điểm dừng bút",
      image: {
        kind: "emoji",
        ref: "🛑",
      },
      category: {
        type: "viết chữ đẹp",
      },
      value: 7,
      contrast_group: "contrast",
    },
    {
      id: "wrt_chu_dep",
      label: "dòng chữ ngay ngắn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
      category: {
        type: "viết chữ đẹp",
      },
      value: 8,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["dòng ô li", "viết chữ đẹp"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "wrt_o_li_vuong",
      target_id: "wrt_duong_ke_ngang",
    },
    {
      type: "pair",
      source_id: "wrt_duong_ke_doc",
      target_id: "wrt_diem_dat_but",
    },
    {
      type: "pair",
      source_id: "wrt_do_cao_chu",
      target_id: "wrt_khoang_cach_chu",
    },
    {
      type: "pair",
      source_id: "wrt_dung_but",
      target_id: "wrt_chu_dep",
    },
    {
      type: "contrast",
      source_id: "wrt_o_li_vuong",
      target_id: "wrt_do_cao_chu",
    },
    {
      type: "contrast",
      source_id: "wrt_duong_ke_ngang",
      target_id: "wrt_khoang_cach_chu",
    },
    {
      type: "contrast",
      source_id: "wrt_duong_ke_doc",
      target_id: "wrt_dung_but",
    },
    {
      type: "contrast",
      source_id: "wrt_diem_dat_but",
      target_id: "wrt_chu_dep",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Viết chữ cái trong ô li",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Viết chữ cái trong ô li",
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
      "Chúng mình cùng tìm hiểu về Viết chữ cái trong ô li nhé",
  },
  ordering: [
    "wrt_o_li_vuong",
    "wrt_duong_ke_ngang",
    "wrt_duong_ke_doc",
    "wrt_diem_dat_but",
    "wrt_do_cao_chu",
    "wrt_khoang_cach_chu",
    "wrt_dung_but",
    "wrt_chu_dep",
  ],
};

export const C5_WRT_07_SEED: SkillSeed = {
  identity: C5_WRT_07_IDENTITY,
  dataset: C5_WRT_07_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-MEAS-0001",
      template: "GT-028",
      band: "5-6",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-MEAS-0002",
      template: "GT-028",
      band: "5-6",
      difficulty: 5,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TIME-0001",
      template: "GT-029",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
