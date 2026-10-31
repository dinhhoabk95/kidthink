import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_02_IDENTITY: SkillIdentity = {
  code: "C5.WRT.02",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Nét thẳng, nét ngang",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "create"],
  tier: "basic",
  prerequisites: ["C5.WRT.01"],
  learning_objectives: [
    {
      code: "LO-C5.WRT.02-01",
      behaviour: "Nhận biết và thực hành Nét thẳng, nét ngang ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.02-02",
      behaviour: "Vận dụng Nét thẳng, nét ngang trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nét thẳng, nét ngang",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_02_DATASET: SkillDataset = {
  skill_code: "C5.WRT.02",
  concept_label: "Nét thẳng, nét ngang",
  surface: "game",
  items: [
    {
      id: "wrt_net_so",
      label: "nét sổ thẳng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "nét thẳng",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_net_ngang",
      label: "nét ngang",
      value: 2,
      image: {
        kind: "emoji",
        ref: "➖",
      },
      category: {
        type: "nét thẳng",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_duong_thang",
      label: "đường kẻ thẳng",
      value: 3,
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "nét thẳng",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_cot_thang",
      label: "cây cột thẳng",
      value: 4,
      image: {
        kind: "emoji",
        ref: "💈",
      },
      category: {
        type: "nét thẳng",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_net_xien_phai",
      label: "nét xiên phải",
      value: 5,
      image: {
        kind: "emoji",
        ref: "📐",
      },
      category: {
        type: "nét xiên gấp",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrt_net_xien_trai",
      label: "nét xiên trái",
      value: 6,
      image: {
        kind: "emoji",
        ref: "📉",
      },
      category: {
        type: "nét xiên gấp",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrt_net_gay",
      label: "nét gấp khúc",
      value: 7,
      image: {
        kind: "emoji",
        ref: "⚡",
      },
      category: {
        type: "nét xiên gấp",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrt_mai_nha",
      label: "nét chéo mái nhà",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "nét xiên gấp",
      },
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["nét thẳng", "nét xiên gấp"],
      ordered: true,
    },
  },
  relations: [
    { type: "pair", source_id: "wrt_net_so", target_id: "wrt_net_ngang" },
    { type: "pair", source_id: "wrt_duong_thang", target_id: "wrt_cot_thang" },
    {
      type: "pair",
      source_id: "wrt_net_xien_phai",
      target_id: "wrt_net_xien_trai",
    },
    { type: "pair", source_id: "wrt_net_gay", target_id: "wrt_mai_nha" },
    {
      type: "contrast",
      source_id: "wrt_net_so",
      target_id: "wrt_net_xien_phai",
    },
    {
      type: "contrast",
      source_id: "wrt_net_ngang",
      target_id: "wrt_net_xien_trai",
    },
    {
      type: "contrast",
      source_id: "wrt_duong_thang",
      target_id: "wrt_net_gay",
    },
    { type: "contrast", source_id: "wrt_cot_thang", target_id: "wrt_mai_nha" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nét thẳng, nét ngang",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nét thẳng, nét ngang",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nét thẳng, nét ngang nhé",
  },
  ordering: [
    "wrt_net_so",
    "wrt_net_ngang",
    "wrt_duong_thang",
    "wrt_cot_thang",
    "wrt_net_xien_phai",
    "wrt_net_xien_trai",
    "wrt_net_gay",
    "wrt_mai_nha",
  ],
};

export const C5_WRT_02_SEED: SkillSeed = {
  identity: C5_WRT_02_IDENTITY,
  dataset: C5_WRT_02_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
  ],
};
