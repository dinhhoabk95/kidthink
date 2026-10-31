import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_GRM_04_IDENTITY: SkillIdentity = {
  code: "C5.GRM.04",
  strand_code: "C5.GRM",
  competency_code: "C5",
  name: "Câu hỏi và câu kể",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "compare"],
  tier: "advanced",
  prerequisites: ["C5.QUE.02"],
  learning_objectives: [
    {
      code: "LO-C5.GRM.04-01",
      behaviour: "Nhận biết và thực hành Câu hỏi và câu kể ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.GRM.04-02",
      behaviour: "Vận dụng Câu hỏi và câu kể trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.GRM.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Câu hỏi và câu kể",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_GRM_04_DATASET: SkillDataset = {
  skill_code: "C5.GRM.04",
  concept_label: "Câu hỏi và câu kể",
  surface: "game",
  items: [
    {
      id: "grm_cau_ke_thoi_tiet",
      label: "câu kể trời nắng",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "câu kể",
        label: "Câu kể",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "grm_cau_ke_hoat_dong",
      label: "câu kể bé đi học",
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "câu kể",
        label: "Câu kể",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "grm_cau_ke_so_thich",
      label: "câu kể bé thích vẽ",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "câu kể",
        label: "Câu kể",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "grm_cau_hoi_ai",
      label: "câu hỏi ai đây",
      image: {
        kind: "emoji",
        ref: "❓",
      },
      category: {
        type: "câu hỏi",
        label: "Câu hỏi",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "grm_cau_hoi_o_dau",
      label: "câu hỏi ở đâu",
      image: {
        kind: "emoji",
        ref: "🗺️",
      },
      category: {
        type: "câu hỏi",
        label: "Câu hỏi",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "grm_cau_hoi_lam_gi",
      label: "câu hỏi làm gì",
      image: {
        kind: "emoji",
        ref: "🔍",
      },
      category: {
        type: "câu hỏi",
        label: "Câu hỏi",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  axes: {
    category: {
      values: ["câu kể", "câu hỏi"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "grm_cau_ke_thoi_tiet",
      target_id: "grm_cau_ke_hoat_dong",
      explanation: "cả hai đều là câu kể thông báo",
    },
    {
      type: "pair",
      source_id: "grm_cau_hoi_ai",
      target_id: "grm_cau_hoi_o_dau",
      explanation: "cả hai đều là câu hỏi",
    },
    {
      type: "contrast",
      source_id: "grm_cau_ke_thoi_tiet",
      target_id: "grm_cau_hoi_ai",
      explanation: "câu kể đối lập với câu hỏi",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Câu hỏi và câu kể",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Câu hỏi và câu kể",
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
    narration_template: "Chúng mình cùng tìm hiểu về Câu hỏi và câu kể nhé",
  },
  ordering: [
    "grm_cau_ke_thoi_tiet",
    "grm_cau_ke_hoat_dong",
    "grm_cau_ke_so_thich",
    "grm_cau_hoi_ai",
    "grm_cau_hoi_o_dau",
    "grm_cau_hoi_lam_gi",
  ],
};

export const C5_GRM_04_SEED: SkillSeed = {
  identity: C5_GRM_04_IDENTITY,
  dataset: C5_GRM_04_DATASET,
  levels: [
    {
      code: "GL-C5-GRM-TAP-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-TAP-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
