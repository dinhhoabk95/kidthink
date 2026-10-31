import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_GRM_01_IDENTITY: SkillIdentity = {
  code: "C5.GRM.01",
  strand_code: "C5.GRM",
  competency_code: "C5",
  name: "Câu đủ ý",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["describe", "verify"],
  tier: "core",
  prerequisites: ["C5.DES.01"],
  learning_objectives: [
    {
      code: "LO-C5.GRM.01-01",
      behaviour: "Nhận biết và thực hành Câu đủ ý ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.GRM.01-02",
      behaviour: "Vận dụng Câu đủ ý trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.GRM.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Câu đủ ý",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_GRM_01_DATASET: SkillDataset = {
  skill_code: "C5.GRM.01",
  concept_label: "Câu đủ ý",
  surface: "game",
  items: [
    {
      id: "grm_chao_hoi",
      label: "cháu chào ông bà",
      image: {
        kind: "emoji",
        ref: "🙋",
      },
      category: {
        type: "câu lễ phép",
        label: "Câu lễ phép",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "grm_cam_on",
      label: "con cảm ơn mẹ",
      image: {
        kind: "emoji",
        ref: "🙏",
      },
      category: {
        type: "câu lễ phép",
        label: "Câu lễ phép",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "grm_xin_phep",
      label: "con xin phép cô",
      image: {
        kind: "emoji",
        ref: "🙇",
      },
      category: {
        type: "câu lễ phép",
        label: "Câu lễ phép",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "grm_gioi_thieu",
      label: "con tên bé An",
      image: {
        kind: "emoji",
        ref: "🧒",
      },
      category: {
        type: "câu bày tỏ",
        label: "Câu bày tỏ",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "grm_mong_muon",
      label: "con muốn uống nước",
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      category: {
        type: "câu bày tỏ",
        label: "Câu bày tỏ",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "grm_khen_ngoi",
      label: "bông hoa đẹp quá",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "câu bày tỏ",
        label: "Câu bày tỏ",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  axes: {
    category: {
      values: ["câu lễ phép", "câu bày tỏ"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "grm_chao_hoi",
      target_id: "grm_cam_on",
      explanation: "cùng là câu lễ phép",
    },
    {
      type: "pair",
      source_id: "grm_gioi_thieu",
      target_id: "grm_mong_muon",
      explanation: "cùng là câu bày tỏ ý kiến",
    },
    {
      type: "contrast",
      source_id: "grm_chao_hoi",
      target_id: "grm_gioi_thieu",
      explanation: "câu lễ phép đối lập với câu bày tỏ",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Câu đủ ý",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Câu đủ ý",
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
    narration_template: "Chúng mình cùng tìm hiểu về Câu đủ ý nhé",
  },
  ordering: [
    "grm_chao_hoi",
    "grm_cam_on",
    "grm_xin_phep",
    "grm_gioi_thieu",
    "grm_mong_muon",
    "grm_khen_ngoi",
  ],
};

export const C5_GRM_01_SEED: SkillSeed = {
  identity: C5_GRM_01_IDENTITY,
  dataset: C5_GRM_01_DATASET,
  levels: [
    {
      code: "GL-C5-GRM-MEAS-0001",
      template: "GT-028",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-MEAS-0002",
      template: "GT-028",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-TIME-0001",
      template: "GT-029",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
  ],
};
