import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRA_04_IDENTITY: SkillIdentity = {
  code: "C5.PRA.04",
  strand_code: "C5.PRA",
  competency_code: "C5",
  name: "Hỏi lại khi chưa hiểu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "verify"],
  tier: "advanced",
  prerequisites: ["C5.QUE.02"],
  learning_objectives: [
    {
      code: "LO-C5.PRA.04-01",
      behaviour: "Nhận biết và thực hành Hỏi lại khi chưa hiểu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRA.04-02",
      behaviour: "Vận dụng Hỏi lại khi chưa hiểu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRA.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Hỏi lại khi chưa hiểu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRA_04_DATASET: SkillDataset = {
  skill_code: "C5.PRA.04",
  concept_label: "Hỏi lại khi chưa hiểu",
  surface: "game",
  items: [
    {
      id: "pra_thua_co",
      label: "thưa cô giảng lại",
      image: {
        kind: "emoji",
        ref: "🙋",
      },
      category: {
        type: "hỏi lễ phép",
        label: "Hỏi lễ phép",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/pra/thua_co_chua_ro.mp3",
    },
    {
      id: "pra_nho_nhac_lai",
      label: "nhờ cô nhắc lại giúp",
      image: {
        kind: "emoji",
        ref: "👂",
      },
      category: {
        type: "hỏi lễ phép",
        label: "Hỏi lễ phép",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/pra/nho_co_nhac_lai.mp3",
    },
    {
      id: "pra_hoi_ban",
      label: "bạn chỉ giúp tớ với",
      image: {
        kind: "emoji",
        ref: "🤝",
      },
      category: {
        type: "hỏi lễ phép",
        label: "Hỏi lễ phép",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pra/ban_chi_giup_to.mp3",
    },
    {
      id: "pra_lang_nghe_ky",
      label: "chú ý lắng nghe cô",
      image: {
        kind: "emoji",
        ref: "👀",
      },
      category: {
        type: "nghe chăm chú",
        label: "Nghe chăm chú",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pra/chu_y_lang_nghe.mp3",
    },
    {
      id: "pra_cam_on_chi_dan",
      label: "cảm ơn khi được chỉ",
      image: {
        kind: "emoji",
        ref: "🙏",
      },
      category: {
        type: "nghe chăm chú",
        label: "Nghe chăm chú",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pra/cam_on_duoc_chi.mp3",
    },
    {
      id: "pra_gat_dau_hieu",
      label: "gật đầu khi đã hiểu",
      image: {
        kind: "emoji",
        ref: "😊",
      },
      category: {
        type: "nghe chăm chú",
        label: "Nghe chăm chú",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pra/gat_dau_da_hieu.mp3",
    },
  ],
  axes: {
    category: {
      values: ["hỏi lễ phép", "nghe chăm chú"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pra_thua_co",
      target_id: "pra_lang_nghe_ky",
      explanation: "Hỏi lại lễ phép đối lập với lắng nghe chăm chú",
    },
    {
      type: "contrast",
      source_id: "pra_nho_nhac_lai",
      target_id: "pra_cam_on_chi_dan",
      explanation: "Nhờ nhắc lại đối lập với cảm ơn khi được chỉ dẫn",
    },
    {
      type: "contrast",
      source_id: "pra_hoi_ban",
      target_id: "pra_gat_dau_hieu",
      explanation: "Hỏi bạn chỉ giúp đối lập với gật đầu khi đã hiểu",
    },
    {
      type: "pair",
      source_id: "pra_thua_co",
      target_id: "pra_lang_nghe_ky",
      explanation: "Cặp hành vi tương ứng khi giao tiếp với cô giáo",
    },
    {
      type: "pair",
      source_id: "pra_nho_nhac_lai",
      target_id: "pra_cam_on_chi_dan",
      explanation: "Cặp hành vi tương ứng khi nhận trợ giúp",
    },
    {
      type: "pair",
      source_id: "pra_hoi_ban",
      target_id: "pra_gat_dau_hieu",
      explanation: "Cặp hành vi tương ứng khi học tập cùng bạn bè",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Hỏi lại khi chưa hiểu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hỏi lại khi chưa hiểu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Hỏi lại khi chưa hiểu nhé",
  },
  ordering: [
    "pra_thua_co",
    "pra_nho_nhac_lai",
    "pra_hoi_ban",
    "pra_lang_nghe_ky",
    "pra_cam_on_chi_dan",
    "pra_gat_dau_hieu",
  ],
};

export const C5_PRA_04_SEED: SkillSeed = {
  identity: C5_PRA_04_IDENTITY,
  dataset: C5_PRA_04_DATASET,
  levels: [
    {
      code: "GL-C5-PRA-MEAS-0003",
      template: "GT-028",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-MEAS-0004",
      template: "GT-028",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TIME-0003",
      template: "GT-029",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
  ],
};
