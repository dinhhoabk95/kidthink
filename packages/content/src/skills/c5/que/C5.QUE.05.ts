import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_QUE_05_IDENTITY: SkillIdentity = {
  code: "C5.QUE.05",
  strand_code: "C5.QUE",
  competency_code: "C5",
  name: 'Trả lời "Tại sao?"',
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "deduce"],
  tier: "advanced",
  prerequisites: ["C5.QUE.02", "C3.INF.03"],
  learning_objectives: [
    {
      code: "LO-C5.QUE.05-01",
      behaviour: 'Nhận biết và thực hành Trả lời "Tại sao?" ở mức cơ bản',
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.QUE.05-02",
      behaviour: 'Vận dụng Trả lời "Tại sao?" trong môi trường tương tác',
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.QUE.05-03",
      behaviour: 'Giải quyết vấn đề nâng cao liên quan tới Trả lời "Tại sao?"',
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_QUE_05_DATASET: SkillDataset = {
  skill_code: "C5.QUE.05",
  concept_label: 'Trả lời "Tại sao?"',
  surface: "game",
  items: [
    {
      id: "que_tai_sao_an_com",
      label: "ăn cơm vì đói",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🍚",
      },
      audio_path: "/audio/vi/c5/que/tai_sao_an_com.mp3",
      category: {
        type: "việc sinh hoạt",
      },
      contrast_group: "primary",
    },
    {
      id: "que_tai_sao_di_ngu",
      label: "đi ngủ vì buồn ngủ",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      audio_path: "/audio/vi/c5/que/tai_sao_di_ngu.mp3",
      category: {
        type: "việc sinh hoạt",
      },
      contrast_group: "primary",
    },
    {
      id: "que_tai_sao_rua_tay",
      label: "rửa tay vì bẩn",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🧼",
      },
      audio_path: "/audio/vi/c5/que/tai_sao_rua_tay.mp3",
      category: {
        type: "việc sinh hoạt",
      },
      contrast_group: "primary",
    },
    {
      id: "que_tai_sao_che_o",
      label: "che ô vì trời mưa",
      value: 4,
      image: {
        kind: "emoji",
        ref: "☂️",
      },
      audio_path: "/audio/vi/c5/que/tai_sao_che_o.mp3",
      category: {
        type: "việc thời tiết",
      },
      contrast_group: "contrast",
    },
    {
      id: "que_tai_sao_mac_am",
      label: "mặc áo vì trời rét",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🧥",
      },
      audio_path: "/audio/vi/c5/que/tai_sao_mac_am.mp3",
      category: {
        type: "việc thời tiết",
      },
      contrast_group: "contrast",
    },
    {
      id: "que_tai_sao_doi_mu",
      label: "đội mũ vì trời nắng",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      audio_path: "/audio/vi/c5/que/tai_sao_doi_mu.mp3",
      category: {
        type: "việc thời tiết",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: 'Làm quen cơ bản với Trả lời "Tại sao?"',
    },
    {
      rung: 2,
      dimension: "range",
      description: 'Nhận biết và chọn đúng Trả lời "Tại sao?"',
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
    narration_template: 'Chúng mình cùng tìm hiểu về Trả lời "Tại sao?" nhé',
  },
  ordering: [
    "que_tai_sao_an_com",
    "que_tai_sao_di_ngu",
    "que_tai_sao_rua_tay",
    "que_tai_sao_che_o",
    "que_tai_sao_mac_am",
    "que_tai_sao_doi_mu",
  ],
  axes: {
    category: {
      values: ["việc sinh hoạt", "việc thời tiết"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "que_tai_sao_an_com",
      target_id: "que_tai_sao_di_ngu",
    },
    {
      type: "pair",
      source_id: "que_tai_sao_che_o",
      target_id: "que_tai_sao_mac_am",
    },
    {
      type: "contrast",
      source_id: "que_tai_sao_an_com",
      target_id: "que_tai_sao_che_o",
    },
    {
      type: "contrast",
      source_id: "que_tai_sao_di_ngu",
      target_id: "que_tai_sao_mac_am",
    },
    {
      type: "contrast",
      source_id: "que_tai_sao_rua_tay",
      target_id: "que_tai_sao_doi_mu",
    },
  ],
};

export const C5_QUE_05_SEED: SkillSeed = {
  identity: C5_QUE_05_IDENTITY,
  dataset: C5_QUE_05_DATASET,
  levels: [
    {
      code: "GL-C5-QUE-FRAC-0001",
      template: "GT-034",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-FRAC-0002",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-TAP-0011",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
