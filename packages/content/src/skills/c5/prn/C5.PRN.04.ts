import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRN_04_IDENTITY: SkillIdentity = {
  code: "C5.PRN.04",
  strand_code: "C5.PRN",
  competency_code: "C5",
  name: "Khoảng cách giữa các từ",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "count"],
  tier: "core",
  prerequisites: ["C5.PRN.03"],
  learning_objectives: [
    {
      code: "LO-C5.PRN.04-01",
      behaviour: "Nhận biết và thực hành Khoảng cách giữa các từ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRN.04-02",
      behaviour: "Vận dụng Khoảng cách giữa các từ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRN.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Khoảng cách giữa các từ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRN_04_DATASET: SkillDataset = {
  skill_code: "C5.PRN.04",
  concept_label: "Khoảng cách giữa các từ",
  surface: "game",
  items: [
    {
      id: "prn_tu_ngan_cach",
      label: "khoảng cách chữ o",
      value: 1,
      image: {
        kind: "emoji",
        ref: "📏",
      },
      audio_path: "/audio/vi/c5/prn/khoang_cach_chu_o.mp3",
      category: {
        type: "khoảng cách đều",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_cach_mot_ngon",
      label: "khoảng cách ngón tay",
      value: 2,
      image: {
        kind: "emoji",
        ref: "☝️",
      },
      audio_path: "/audio/vi/c5/prn/khoang_cach_ngon_tay.mp3",
      category: {
        type: "khoảng cách đều",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_dong_chu_dep",
      label: "hàng chữ cách đều",
      value: 3,
      image: {
        kind: "emoji",
        ref: "✨",
      },
      audio_path: "/audio/vi/c5/prn/hang_chu_cach_deu.mp3",
      category: {
        type: "khoảng cách đều",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_chu_dinh_nhau",
      label: "từ dính sát",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🧩",
      },
      audio_path: "/audio/vi/c5/prn/tu_dinh_sat_nhau.mp3",
      category: {
        type: "khoảng cách lệch",
      },
      contrast_group: "contrast",
    },
    {
      id: "prn_chu_qua_xa",
      label: "từ cách xa",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🕳️",
      },
      audio_path: "/audio/vi/c5/prn/tu_cach_qua_xa.mp3",
      category: {
        type: "khoảng cách lệch",
      },
      contrast_group: "contrast",
    },
    {
      id: "prn_dong_khong_deu",
      label: "khoảng cách lệch",
      value: 6,
      image: {
        kind: "emoji",
        ref: "〰️",
      },
      audio_path: "/audio/vi/c5/prn/khoang_cach_khong_deu.mp3",
      category: {
        type: "khoảng cách lệch",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Khoảng cách giữa các từ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Khoảng cách giữa các từ",
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
      "Chúng mình cùng tìm hiểu về Khoảng cách giữa các từ nhé",
  },
  ordering: [
    "prn_tu_ngan_cach",
    "prn_cach_mot_ngon",
    "prn_dong_chu_dep",
    "prn_chu_dinh_nhau",
    "prn_chu_qua_xa",
    "prn_dong_khong_deu",
  ],
  axes: {
    category: {
      values: ["khoảng cách đều", "khoảng cách lệch"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "prn_tu_ngan_cach",
      target_id: "prn_cach_mot_ngon",
    },
    {
      type: "pair",
      source_id: "prn_chu_dinh_nhau",
      target_id: "prn_chu_qua_xa",
    },
    {
      type: "contrast",
      source_id: "prn_tu_ngan_cach",
      target_id: "prn_chu_dinh_nhau",
    },
    {
      type: "contrast",
      source_id: "prn_cach_mot_ngon",
      target_id: "prn_chu_qua_xa",
    },
    {
      type: "contrast",
      source_id: "prn_dong_chu_dep",
      target_id: "prn_dong_khong_deu",
    },
  ],
};

export const C5_PRN_04_SEED: SkillSeed = {
  identity: C5_PRN_04_IDENTITY,
  dataset: C5_PRN_04_DATASET,
  levels: [
    {
      code: "GL-C5-PRN-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0007",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
  ],
};
