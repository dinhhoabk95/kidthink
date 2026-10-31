import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRN_02_IDENTITY: SkillIdentity = {
  code: "C5.PRN.02",
  strand_code: "C5.PRN",
  competency_code: "C5",
  name: "Chữ ở quanh ta: biển hiệu · nhãn",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: ["C5.PRN.01"],
  learning_objectives: [
    {
      code: "LO-C5.PRN.02-01",
      behaviour:
        "Nhận biết và thực hành Chữ ở quanh ta: biển hiệu · nhãn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRN.02-02",
      behaviour:
        "Vận dụng Chữ ở quanh ta: biển hiệu · nhãn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRN.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chữ ở quanh ta: biển hiệu · nhãn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRN_02_DATASET: SkillDataset = {
  skill_code: "C5.PRN.02",
  concept_label: "Chữ ở quanh ta: biển hiệu · nhãn",
  surface: "game",
  items: [
    {
      id: "prn_hieu_sach",
      label: "tiệm sách",
      value: 1,
      image: {
        kind: "emoji",
        ref: "📚",
      },
      audio_path: "/audio/vi/c5/prn/bien_tiem_sach.mp3",
      category: {
        type: "biển cửa hàng",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_tiem_banh",
      label: "tiệm bánh",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🥖",
      },
      audio_path: "/audio/vi/c5/prn/bien_tiem_banh.mp3",
      category: {
        type: "biển cửa hàng",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_tiem_thuoc",
      label: "quầy thuốc",
      value: 3,
      image: {
        kind: "emoji",
        ref: "💊",
      },
      audio_path: "/audio/vi/c5/prn/bien_quay_thuoc.mp3",
      category: {
        type: "biển cửa hàng",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_nhan_vo",
      label: "nhãn vở",
      value: 4,
      image: {
        kind: "emoji",
        ref: "📒",
      },
      audio_path: "/audio/vi/c5/prn/nhan_dan_vo.mp3",
      category: {
        type: "nhãn đồ dùng",
      },
      contrast_group: "contrast",
    },
    {
      id: "prn_nhan_hop_but",
      label: "nhãn hộp bút",
      value: 5,
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      audio_path: "/audio/vi/c5/prn/nhan_hop_but.mp3",
      category: {
        type: "nhãn đồ dùng",
      },
      contrast_group: "contrast",
    },
    {
      id: "prn_nhan_ba_lo",
      label: "nhãn ba lô",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      audio_path: "/audio/vi/c5/prn/nhan_ba_lo.mp3",
      category: {
        type: "nhãn đồ dùng",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ ở quanh ta: biển hiệu · nhãn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ ở quanh ta: biển hiệu · nhãn",
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
      "Chúng mình cùng tìm hiểu về Chữ ở quanh ta: biển hiệu · nhãn nhé",
  },
  ordering: [
    "prn_hieu_sach",
    "prn_tiem_banh",
    "prn_tiem_thuoc",
    "prn_nhan_vo",
    "prn_nhan_hop_but",
    "prn_nhan_ba_lo",
  ],
  axes: {
    category: {
      values: ["biển cửa hàng", "nhãn đồ dùng"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "prn_hieu_sach",
      target_id: "prn_tiem_banh",
    },
    {
      type: "pair",
      source_id: "prn_nhan_vo",
      target_id: "prn_nhan_hop_but",
    },
    {
      type: "contrast",
      source_id: "prn_hieu_sach",
      target_id: "prn_nhan_vo",
    },
    {
      type: "contrast",
      source_id: "prn_tiem_banh",
      target_id: "prn_nhan_hop_but",
    },
    {
      type: "contrast",
      source_id: "prn_tiem_thuoc",
      target_id: "prn_nhan_ba_lo",
    },
  ],
};

export const C5_PRN_02_SEED: SkillSeed = {
  identity: C5_PRN_02_IDENTITY,
  dataset: C5_PRN_02_DATASET,
  levels: [
    {
      code: "GL-C5-PRN-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
  ],
};
