import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRN_01_IDENTITY: SkillIdentity = {
  code: "C5.PRN.01",
  strand_code: "C5.PRN",
  competency_code: "C5",
  name: "Chữ mang nghĩa",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["infer", "observe"],
  tier: "basic",
  prerequisites: ["C5.ALP.01"],
  learning_objectives: [
    {
      code: "LO-C5.PRN.01-01",
      behaviour: "Nhận biết và thực hành Chữ mang nghĩa ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRN.01-02",
      behaviour: "Vận dụng Chữ mang nghĩa trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRN.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chữ mang nghĩa",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRN_01_DATASET: SkillDataset = {
  skill_code: "C5.PRN.01",
  concept_label: "Chữ mang nghĩa",
  surface: "game",
  items: [
    {
      id: "prn_bien_dung",
      label: "biển dừng lại",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🛑",
      },
      audio_path: "/audio/vi/c5/prn/bien_dung_lai.mp3",
      category: {
        type: "biển chỉ dẫn",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_loi_thoat",
      label: "biển lối thoát",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🚪",
      },
      audio_path: "/audio/vi/c5/prn/bien_loi_thoat.mp3",
      category: {
        type: "biển chỉ dẫn",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_cam_vao",
      label: "biển cấm vào",
      value: 3,
      image: {
        kind: "emoji",
        ref: "⛔",
      },
      audio_path: "/audio/vi/c5/prn/bien_cam_vao.mp3",
      category: {
        type: "biển chỉ dẫn",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_thu_vien",
      label: "ký hiệu thư viện",
      value: 4,
      image: {
        kind: "emoji",
        ref: "📖",
      },
      audio_path: "/audio/vi/c5/prn/ky_hieu_sach.mp3",
      category: {
        type: "ký hiệu quen",
      },
      contrast_group: "contrast",
    },
    {
      id: "prn_benh_vien",
      label: "ký hiệu bệnh viện",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🏥",
      },
      audio_path: "/audio/vi/c5/prn/ky_hieu_y_te.mp3",
      category: {
        type: "ký hiệu quen",
      },
      contrast_group: "contrast",
    },
    {
      id: "prn_ve_sinh",
      label: "ký hiệu vệ sinh",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🚻",
      },
      audio_path: "/audio/vi/c5/prn/ky_hieu_ve_sinh.mp3",
      category: {
        type: "ký hiệu quen",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ mang nghĩa",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ mang nghĩa",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chữ mang nghĩa nhé",
  },
  ordering: [
    "prn_bien_dung",
    "prn_loi_thoat",
    "prn_cam_vao",
    "prn_thu_vien",
    "prn_benh_vien",
    "prn_ve_sinh",
  ],
  axes: {
    category: {
      values: ["biển chỉ dẫn", "ký hiệu quen"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "prn_bien_dung",
      target_id: "prn_loi_thoat",
    },
    {
      type: "pair",
      source_id: "prn_thu_vien",
      target_id: "prn_benh_vien",
    },
    {
      type: "contrast",
      source_id: "prn_bien_dung",
      target_id: "prn_thu_vien",
    },
    {
      type: "contrast",
      source_id: "prn_loi_thoat",
      target_id: "prn_benh_vien",
    },
    {
      type: "contrast",
      source_id: "prn_cam_vao",
      target_id: "prn_ve_sinh",
    },
  ],
};

export const C5_PRN_01_SEED: SkillSeed = {
  identity: C5_PRN_01_IDENTITY,
  dataset: C5_PRN_01_DATASET,
  levels: [
    {
      code: "GL-C5-PRN-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
