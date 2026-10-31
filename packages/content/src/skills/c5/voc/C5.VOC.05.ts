import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_05_IDENTITY: SkillIdentity = {
  code: "C5.VOC.05",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng phương tiện",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.05-01",
      behaviour: "Nhận biết và thực hành Từ vựng phương tiện ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.05-02",
      behaviour: "Vận dụng Từ vựng phương tiện trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Từ vựng phương tiện",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_05_DATASET: SkillDataset = {
  skill_code: "C5.VOC.05",
  concept_label: "Từ vựng phương tiện",
  surface: "game",
  items: [
    {
      id: "voc_xe_dap",
      label: "xe đạp",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "xe đường bộ",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "voc_xe_may",
      label: "xe máy",
      image: {
        kind: "emoji",
        ref: "🛵",
      },
      category: {
        type: "xe đường bộ",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "voc_o_to",
      label: "ô tô",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "xe đường bộ",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "voc_xe_bus",
      label: "xe buýt",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "xe đường bộ",
      },
      value: 4,
      contrast_group: "primary",
    },
    {
      id: "voc_tau_hoa",
      label: "tàu hỏa",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "tàu máy bay",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "voc_tau_thuy",
      label: "tàu thủy",
      image: {
        kind: "emoji",
        ref: "🚢",
      },
      category: {
        type: "tàu máy bay",
      },
      value: 6,
      contrast_group: "contrast",
    },
    {
      id: "voc_may_bay",
      label: "máy bay",
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "tàu máy bay",
      },
      value: 7,
      contrast_group: "contrast",
    },
    {
      id: "voc_truc_thang",
      label: "trực thăng",
      image: {
        kind: "emoji",
        ref: "🚁",
      },
      category: {
        type: "tàu máy bay",
      },
      value: 8,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["xe đường bộ", "tàu máy bay"],
      ordered: true,
    },
  },
  relations: [
    { type: "pair", source_id: "voc_xe_dap", target_id: "voc_xe_may" },
    { type: "pair", source_id: "voc_o_to", target_id: "voc_xe_bus" },
    { type: "pair", source_id: "voc_tau_hoa", target_id: "voc_tau_thuy" },
    { type: "pair", source_id: "voc_may_bay", target_id: "voc_truc_thang" },
    { type: "contrast", source_id: "voc_xe_dap", target_id: "voc_tau_hoa" },
    { type: "contrast", source_id: "voc_xe_may", target_id: "voc_tau_thuy" },
    { type: "contrast", source_id: "voc_o_to", target_id: "voc_may_bay" },
    { type: "contrast", source_id: "voc_xe_bus", target_id: "voc_truc_thang" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Từ vựng phương tiện",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng phương tiện",
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
    narration_template: "Chúng mình cùng tìm hiểu về Từ vựng phương tiện nhé",
  },
  ordering: [
    "voc_xe_dap",
    "voc_xe_may",
    "voc_o_to",
    "voc_xe_bus",
    "voc_tau_hoa",
    "voc_tau_thuy",
    "voc_may_bay",
    "voc_truc_thang",
  ],
};

export const C5_VOC_05_SEED: SkillSeed = {
  identity: C5_VOC_05_IDENTITY,
  dataset: C5_VOC_05_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-TAP-0009",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0010",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TCMP-0009",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
