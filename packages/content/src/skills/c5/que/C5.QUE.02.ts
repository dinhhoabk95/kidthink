import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_QUE_02_IDENTITY: SkillIdentity = {
  code: "C5.QUE.02",
  strand_code: "C5.QUE",
  competency_code: "C5",
  name: 'Trả lời "Cái gì?"',
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["listen", "infer"],
  tier: "basic",
  prerequisites: ["C5.LIS.01"],
  learning_objectives: [
    {
      code: "LO-C5.QUE.02-01",
      behaviour: 'Nhận biết và thực hành Trả lời "Cái gì?" ở mức cơ bản',
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.QUE.02-02",
      behaviour: 'Vận dụng Trả lời "Cái gì?" trong môi trường tương tác',
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.QUE.02-03",
      behaviour: 'Giải quyết vấn đề nâng cao liên quan tới Trả lời "Cái gì?"',
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_QUE_02_DATASET: SkillDataset = {
  skill_code: "C5.QUE.02",
  concept_label: 'Trả lời "Cái gì?"',
  surface: "game",
  items: [
    {
      id: "que_cai_doi_dau",
      label: "cái mũ đội đầu",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      audio_path: "/audio/vi/c5/que/cai_mu.mp3",
      category: {
        type: "đồ để mặc",
      },
      contrast_group: "primary",
    },
    {
      id: "que_cai_di_chan",
      label: "đôi giày đi chân",
      value: 2,
      image: {
        kind: "emoji",
        ref: "👟",
      },
      audio_path: "/audio/vi/c5/que/doi_giay.mp3",
      category: {
        type: "đồ để mặc",
      },
      contrast_group: "primary",
    },
    {
      id: "que_cai_mac_ao",
      label: "chiếc áo ấm",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🧥",
      },
      audio_path: "/audio/vi/c5/que/chiec_ao.mp3",
      category: {
        type: "đồ để mặc",
      },
      contrast_group: "primary",
    },
    {
      id: "que_cai_che_mua",
      label: "cái ô che mưa",
      value: 4,
      image: {
        kind: "emoji",
        ref: "☂️",
      },
      audio_path: "/audio/vi/c5/que/cai_o.mp3",
      category: {
        type: "đồ sinh hoạt",
      },
      contrast_group: "contrast",
    },
    {
      id: "que_cai_uong_nuoc",
      label: "cái cốc uống nước",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🥛",
      },
      audio_path: "/audio/vi/c5/que/cai_coc.mp3",
      category: {
        type: "đồ sinh hoạt",
      },
      contrast_group: "contrast",
    },
    {
      id: "que_cai_ve_tranh",
      label: "bút sáp màu",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
      audio_path: "/audio/vi/c5/que/but_sap_mau.mp3",
      category: {
        type: "đồ sinh hoạt",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: 'Làm quen cơ bản với Trả lời "Cái gì?"',
    },
    {
      rung: 2,
      dimension: "range",
      description: 'Nhận biết và chọn đúng Trả lời "Cái gì?"',
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
    narration_template: 'Chúng mình cùng tìm hiểu về Trả lời "Cái gì?" nhé',
  },
  ordering: [
    "que_cai_doi_dau",
    "que_cai_di_chan",
    "que_cai_mac_ao",
    "que_cai_che_mua",
    "que_cai_uong_nuoc",
    "que_cai_ve_tranh",
  ],
  axes: {
    category: {
      values: ["đồ để mặc", "đồ sinh hoạt"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "que_cai_doi_dau",
      target_id: "que_cai_di_chan",
    },
    {
      type: "pair",
      source_id: "que_cai_che_mua",
      target_id: "que_cai_uong_nuoc",
    },
    {
      type: "contrast",
      source_id: "que_cai_doi_dau",
      target_id: "que_cai_che_mua",
    },
    {
      type: "contrast",
      source_id: "que_cai_di_chan",
      target_id: "que_cai_uong_nuoc",
    },
    {
      type: "contrast",
      source_id: "que_cai_mac_ao",
      target_id: "que_cai_ve_tranh",
    },
  ],
};

export const C5_QUE_02_SEED: SkillSeed = {
  identity: C5_QUE_02_IDENTITY,
  dataset: C5_QUE_02_DATASET,
  levels: [
    {
      code: "GL-C5-QUE-SHAD-0006",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SHAD-0007",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
