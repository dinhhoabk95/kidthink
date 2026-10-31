import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRN_03_IDENTITY: SkillIdentity = {
  code: "C5.PRN.03",
  strand_code: "C5.PRN",
  competency_code: "C5",
  name: "Đọc trái → phải, trên → dưới",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sequence", "observe"],
  tier: "basic",
  prerequisites: ["C2.ORI.01", "C2.ORI.02"],
  learning_objectives: [
    {
      code: "LO-C5.PRN.03-01",
      behaviour:
        "Nhận biết và thực hành Đọc trái → phải, trên → dưới ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRN.03-02",
      behaviour:
        "Vận dụng Đọc trái → phải, trên → dưới trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRN.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đọc trái → phải, trên → dưới",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRN_03_DATASET: SkillDataset = {
  skill_code: "C5.PRN.03",
  concept_label: "Đọc trái → phải, trên → dưới",
  surface: "game",
  items: [
    {
      id: "prn_dong_1_dau",
      label: "chữ bên trái",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "⬅️",
      },
      audio_path: "/audio/vi/c5/prn/chu_ben_trai.mp3",
      category: {
        type: "hướng trái phải",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_dong_1_giua",
      label: "chữ ở giữa",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "↔️",
      },
      audio_path: "/audio/vi/c5/prn/chu_o_giua.mp3",
      category: {
        type: "hướng trái phải",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_dong_1_cuoi",
      label: "chữ bên phải",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "➡️",
      },
      audio_path: "/audio/vi/c5/prn/chu_ben_phai.mp3",
      category: {
        type: "hướng trái phải",
      },
      contrast_group: "primary",
    },
    {
      id: "prn_trang_tren",
      label: "dòng ở trên",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "⬆️",
      },
      audio_path: "/audio/vi/c5/prn/dong_o_tren.mp3",
      category: {
        type: "hướng trên dưới",
      },
      contrast_group: "contrast",
    },
    {
      id: "prn_trang_giua",
      label: "dòng ở giữa",
      value: 5,
      ordering: 5,
      image: {
        kind: "emoji",
        ref: "↕️",
      },
      audio_path: "/audio/vi/c5/prn/dong_o_giua.mp3",
      category: {
        type: "hướng trên dưới",
      },
      contrast_group: "contrast",
    },
    {
      id: "prn_trang_duoi",
      label: "dòng ở dưới",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "⬇️",
      },
      audio_path: "/audio/vi/c5/prn/dong_o_duoi.mp3",
      category: {
        type: "hướng trên dưới",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đọc trái → phải, trên → dưới",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc trái → phải, trên → dưới",
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
      "Chúng mình cùng tìm hiểu về Đọc trái → phải, trên → dưới nhé",
  },
  ordering: [
    "prn_dong_1_dau",
    "prn_dong_1_giua",
    "prn_dong_1_cuoi",
    "prn_trang_tren",
    "prn_trang_giua",
    "prn_trang_duoi",
  ],
  axes: {
    category: {
      values: ["hướng trái phải", "hướng trên dưới"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "prn_dong_1_dau",
      target_id: "prn_dong_1_cuoi",
    },
    {
      type: "pair",
      source_id: "prn_trang_tren",
      target_id: "prn_trang_duoi",
    },
    {
      type: "contrast",
      source_id: "prn_dong_1_dau",
      target_id: "prn_trang_tren",
    },
    {
      type: "contrast",
      source_id: "prn_dong_1_giua",
      target_id: "prn_trang_giua",
    },
    {
      type: "contrast",
      source_id: "prn_dong_1_cuoi",
      target_id: "prn_trang_duoi",
    },
  ],
};

export const C5_PRN_03_SEED: SkillSeed = {
  identity: C5_PRN_03_IDENTITY,
  dataset: C5_PRN_03_DATASET,
  levels: [
    {
      code: "GL-C5-PRN-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-PRN-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
