import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRA_03_IDENTITY: SkillIdentity = {
  code: "C5.PRA.03",
  strand_code: "C5.PRA",
  competency_code: "C5",
  name: "Nói đủ để người khác hiểu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["describe", "verify"],
  tier: "advanced",
  prerequisites: ["C5.DES.01"],
  learning_objectives: [
    {
      code: "LO-C5.PRA.03-01",
      behaviour:
        "Nhận biết và thực hành Nói đủ để người khác hiểu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRA.03-02",
      behaviour:
        "Vận dụng Nói đủ để người khác hiểu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRA.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nói đủ để người khác hiểu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRA_03_DATASET: SkillDataset = {
  skill_code: "C5.PRA.03",
  concept_label: "Nói đủ để người khác hiểu",
  surface: "game",
  items: [
    {
      id: "pra_noi_tron_cau",
      label: "nói câu trọn vẹn",
      image: {
        kind: "emoji",
        ref: "💬",
      },
      category: {
        type: "nói rõ ràng",
        label: "Nói rõ ràng",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/pra/noi_cau_tron_ven.mp3",
    },
    {
      id: "pra_noi_am_luong_vua",
      label: "nói âm lượng vừa",
      image: {
        kind: "emoji",
        ref: "🔈",
      },
      category: {
        type: "nói rõ ràng",
        label: "Nói rõ ràng",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/pra/noi_am_luong_vua.mp3",
    },
    {
      id: "pra_nhin_nguoi_nghe",
      label: "nhìn người đối diện",
      image: {
        kind: "emoji",
        ref: "👀",
      },
      category: {
        type: "nói rõ ràng",
        label: "Nói rõ ràng",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pra/nhin_nguoi_doi_dien.mp3",
    },
    {
      id: "pra_noi_qua_nho",
      label: "nói giọng lý nhí",
      image: {
        kind: "emoji",
        ref: "🤫",
      },
      category: {
        type: "nói ngập ngừng",
        label: "Nói ngập ngừng",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pra/noi_qua_nho.mp3",
    },
    {
      id: "pra_noi_qua_to",
      label: "nói giọng quá to",
      image: {
        kind: "emoji",
        ref: "🔊",
      },
      category: {
        type: "nói ngập ngừng",
        label: "Nói ngập ngừng",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pra/noi_qua_to.mp3",
    },
    {
      id: "pra_noi_ngap_ngung",
      label: "nói ngập ngừng ấp úng",
      image: {
        kind: "emoji",
        ref: "🤔",
      },
      category: {
        type: "nói ngập ngừng",
        label: "Nói ngập ngừng",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pra/noi_ngap_ngung.mp3",
    },
  ],
  axes: {
    category: {
      values: ["nói rõ ràng", "nói ngập ngừng"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pra_noi_tron_cau",
      target_id: "pra_noi_ngap_ngung",
      explanation: "Nói câu trọn vẹn đối lập với nói ngập ngừng ấp úng",
    },
    {
      type: "contrast",
      source_id: "pra_noi_am_luong_vua",
      target_id: "pra_noi_qua_to",
      explanation: "Nói âm lượng vừa đối lập với nói giọng quá to",
    },
    {
      type: "contrast",
      source_id: "pra_nhin_nguoi_nghe",
      target_id: "pra_noi_qua_nho",
      explanation: "Nhìn người đối diện đối lập với nói giọng lý nhí",
    },
    {
      type: "pair",
      source_id: "pra_noi_tron_cau",
      target_id: "pra_noi_ngap_ngung",
      explanation: "Cặp so sánh cách diễn đạt trọn vẹn và ấp úng",
    },
    {
      type: "pair",
      source_id: "pra_noi_am_luong_vua",
      target_id: "pra_noi_qua_to",
      explanation: "Cặp so sánh âm lượng vừa phải và quá lớn",
    },
    {
      type: "pair",
      source_id: "pra_nhin_nguoi_nghe",
      target_id: "pra_noi_qua_nho",
      explanation: "Cặp so sánh giao tiếp tự tin và lý nhí",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nói đủ để người khác hiểu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nói đủ để người khác hiểu",
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
      "Chúng mình cùng tìm hiểu về Nói đủ để người khác hiểu nhé",
  },
  ordering: [
    "pra_noi_tron_cau",
    "pra_noi_am_luong_vua",
    "pra_nhin_nguoi_nghe",
    "pra_noi_qua_nho",
    "pra_noi_qua_to",
    "pra_noi_ngap_ngung",
  ],
};

export const C5_PRA_03_SEED: SkillSeed = {
  identity: C5_PRA_03_IDENTITY,
  dataset: C5_PRA_03_DATASET,
  levels: [
    {
      code: "GL-C5-PRA-MEAS-0001",
      template: "GT-028",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-MEAS-0002",
      template: "GT-028",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TIME-0001",
      template: "GT-029",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
