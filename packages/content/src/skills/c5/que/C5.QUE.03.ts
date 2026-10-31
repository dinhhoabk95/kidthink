import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_QUE_03_IDENTITY: SkillIdentity = {
  code: "C5.QUE.03",
  strand_code: "C5.QUE",
  competency_code: "C5",
  name: 'Trả lời "Ở đâu?"',
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "infer"],
  tier: "core",
  prerequisites: ["C5.QUE.02", "C2.ORI.07"],
  learning_objectives: [
    {
      code: "LO-C5.QUE.03-01",
      behaviour: 'Nhận biết và thực hành Trả lời "Ở đâu?" ở mức cơ bản',
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.QUE.03-02",
      behaviour: 'Vận dụng Trả lời "Ở đâu?" trong môi trường tương tác',
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.QUE.03-03",
      behaviour: 'Giải quyết vấn đề nâng cao liên quan tới Trả lời "Ở đâu?"',
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_QUE_03_DATASET: SkillDataset = {
  skill_code: "C5.QUE.03",
  concept_label: 'Trả lời "Ở đâu?"',
  surface: "game",
  items: [
    {
      id: "que_chim_tren_cay",
      label: "chú chim trên cây",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      audio_path: "/audio/vi/c5/que/chim_tren_cay.mp3",
      category: {
        type: "ngoài thiên nhiên",
      },
      contrast_group: "primary",
    },
    {
      id: "que_ca_duoi_nuoc",
      label: "con cá dưới nước",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🌊",
      },
      audio_path: "/audio/vi/c5/que/ca_duoi_nuoc.mp3",
      category: {
        type: "ngoài thiên nhiên",
      },
      contrast_group: "primary",
    },
    {
      id: "que_may_tren_troi",
      label: "đám mây trên trời",
      value: 3,
      image: {
        kind: "emoji",
        ref: "☁️",
      },
      audio_path: "/audio/vi/c5/que/may_tren_troi.mp3",
      category: {
        type: "ngoài thiên nhiên",
      },
      contrast_group: "primary",
    },
    {
      id: "que_sach_tren_gia",
      label: "sách trên giá",
      value: 4,
      image: {
        kind: "emoji",
        ref: "📚",
      },
      audio_path: "/audio/vi/c5/que/sach_tren_gia.mp3",
      category: {
        type: "ở trong nhà",
      },
      contrast_group: "contrast",
    },
    {
      id: "que_be_ngu_tren_giuong",
      label: "bé ngủ trên giường",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      audio_path: "/audio/vi/c5/que/be_tren_giuong.mp3",
      category: {
        type: "ở trong nhà",
      },
      contrast_group: "contrast",
    },
    {
      id: "que_xe_o_gara",
      label: "xe trong nhà xe",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      audio_path: "/audio/vi/c5/que/xe_trong_nha.mp3",
      category: {
        type: "ở trong nhà",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: 'Làm quen cơ bản với Trả lời "Ở đâu?"',
    },
    {
      rung: 2,
      dimension: "range",
      description: 'Nhận biết và chọn đúng Trả lời "Ở đâu?"',
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
    narration_template: 'Chúng mình cùng tìm hiểu về Trả lời "Ở đâu?" nhé',
  },
  ordering: [
    "que_chim_tren_cay",
    "que_ca_duoi_nuoc",
    "que_may_tren_troi",
    "que_sach_tren_gia",
    "que_be_ngu_tren_giuong",
    "que_xe_o_gara",
  ],
  axes: {
    category: {
      values: ["ngoài thiên nhiên", "ở trong nhà"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "que_chim_tren_cay",
      target_id: "que_ca_duoi_nuoc",
    },
    {
      type: "pair",
      source_id: "que_sach_tren_gia",
      target_id: "que_be_ngu_tren_giuong",
    },
    {
      type: "contrast",
      source_id: "que_chim_tren_cay",
      target_id: "que_sach_tren_gia",
    },
    {
      type: "contrast",
      source_id: "que_ca_duoi_nuoc",
      target_id: "que_be_ngu_tren_giuong",
    },
    {
      type: "contrast",
      source_id: "que_may_tren_troi",
      target_id: "que_xe_o_gara",
    },
  ],
};

export const C5_QUE_03_SEED: SkillSeed = {
  identity: C5_QUE_03_IDENTITY,
  dataset: C5_QUE_03_DATASET,
  levels: [
    {
      code: "GL-C5-QUE-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SHAD-0011",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
  ],
};
