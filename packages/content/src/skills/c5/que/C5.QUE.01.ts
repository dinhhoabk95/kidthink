import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_QUE_01_IDENTITY: SkillIdentity = {
  code: "C5.QUE.01",
  strand_code: "C5.QUE",
  competency_code: "C5",
  name: 'Trả lời "Ai?"',
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["listen", "infer"],
  tier: "basic",
  prerequisites: ["C5.LIS.01"],
  learning_objectives: [
    {
      code: "LO-C5.QUE.01-01",
      behaviour: 'Nhận biết và thực hành Trả lời "Ai?" ở mức cơ bản',
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.QUE.01-02",
      behaviour: 'Vận dụng Trả lời "Ai?" trong môi trường tương tác',
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.QUE.01-03",
      behaviour: 'Giải quyết vấn đề nâng cao liên quan tới Trả lời "Ai?"',
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_QUE_01_DATASET: SkillDataset = {
  skill_code: "C5.QUE.01",
  concept_label: 'Trả lời "Ai?"',
  surface: "game",
  items: [
    {
      id: "que_ai_day_hoc",
      label: "cô giáo dạy học",
      value: 1,
      image: {
        kind: "emoji",
        ref: "👩‍🏫",
      },
      audio_path: "/audio/vi/c5/que/co_giao_day_hoc.mp3",
      category: {
        type: "người ở trường",
      },
      contrast_group: "primary",
    },
    {
      id: "que_ai_kham_benh",
      label: "bác sĩ khám bệnh",
      value: 2,
      image: {
        kind: "emoji",
        ref: "👨‍⚕️",
      },
      audio_path: "/audio/vi/c5/que/bac_si_kham_benh.mp3",
      category: {
        type: "người ở trường",
      },
      contrast_group: "primary",
    },
    {
      id: "que_ai_bao_ve",
      label: "bác bảo vệ",
      value: 3,
      image: {
        kind: "emoji",
        ref: "👮",
      },
      audio_path: "/audio/vi/c5/que/bac_bao_ve.mp3",
      category: {
        type: "người ở trường",
      },
      contrast_group: "primary",
    },
    {
      id: "que_ai_lai_xe",
      label: "chú tài xế",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🧑‍✈️",
      },
      audio_path: "/audio/vi/c5/que/chu_tai_xe.mp3",
      category: {
        type: "người quanh bé",
      },
      contrast_group: "contrast",
    },
    {
      id: "que_ai_nau_an",
      label: "chú đầu bếp",
      value: 5,
      image: {
        kind: "emoji",
        ref: "👨‍🍳",
      },
      audio_path: "/audio/vi/c5/que/dau_bep_nau_an.mp3",
      category: {
        type: "người quanh bé",
      },
      contrast_group: "contrast",
    },
    {
      id: "que_ai_tuoi_cay",
      label: "bác làm vườn",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🧑‍🌾",
      },
      audio_path: "/audio/vi/c5/que/bac_lam_vuon.mp3",
      category: {
        type: "người quanh bé",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: 'Làm quen cơ bản với Trả lời "Ai?"',
    },
    {
      rung: 2,
      dimension: "range",
      description: 'Nhận biết và chọn đúng Trả lời "Ai?"',
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
    narration_template: 'Chúng mình cùng tìm hiểu về Trả lời "Ai?" nhé',
  },
  ordering: [
    "que_ai_day_hoc",
    "que_ai_kham_benh",
    "que_ai_bao_ve",
    "que_ai_lai_xe",
    "que_ai_nau_an",
    "que_ai_tuoi_cay",
  ],
  axes: {
    category: {
      values: ["người ở trường", "người quanh bé"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "que_ai_day_hoc",
      target_id: "que_ai_kham_benh",
    },
    {
      type: "pair",
      source_id: "que_ai_lai_xe",
      target_id: "que_ai_nau_an",
    },
    {
      type: "contrast",
      source_id: "que_ai_day_hoc",
      target_id: "que_ai_lai_xe",
    },
    {
      type: "contrast",
      source_id: "que_ai_kham_benh",
      target_id: "que_ai_nau_an",
    },
    {
      type: "contrast",
      source_id: "que_ai_bao_ve",
      target_id: "que_ai_tuoi_cay",
    },
  ],
};

export const C5_QUE_01_SEED: SkillSeed = {
  identity: C5_QUE_01_IDENTITY,
  dataset: C5_QUE_01_DATASET,
  levels: [
    {
      code: "GL-C5-QUE-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
  ],
};
