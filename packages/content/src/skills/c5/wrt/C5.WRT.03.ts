import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_03_IDENTITY: SkillIdentity = {
  code: "C5.WRT.03",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Nét xiên, nét cong",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "create"],
  tier: "core",
  prerequisites: ["C5.WRT.02"],
  learning_objectives: [
    {
      code: "LO-C5.WRT.03-01",
      behaviour: "Nhận biết và thực hành Nét xiên, nét cong ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.03-02",
      behaviour: "Vận dụng Nét xiên, nét cong trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nét xiên, nét cong",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_03_DATASET: SkillDataset = {
  skill_code: "C5.WRT.03",
  concept_label: "Nét xiên, nét cong",
  surface: "game",
  items: [
    {
      id: "wrt_cong_kin",
      label: "nét cong kín",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⭕",
      },
      category: {
        type: "nét cong tròn",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_cong_ho_phai",
      label: "nét cong hở phải",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      category: {
        type: "nét cong tròn",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_cong_ho_trai",
      label: "nét cong hở trái",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🌜",
      },
      category: {
        type: "nét cong tròn",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_qua_bong",
      label: "hình quả bóng tròn",
      value: 4,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "nét cong tròn",
      },
      contrast_group: "primary",
    },
    {
      id: "wrt_luon_song",
      label: "nét lượn sóng",
      value: 5,
      image: {
        kind: "emoji",
        ref: "〰️",
      },
      category: {
        type: "nét uốn lượn",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrt_xoan_oc",
      label: "nét xoắn ốc",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🌀",
      },
      category: {
        type: "nét uốn lượn",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrt_cau_vong",
      label: "nét vòm cầu vồng",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🌈",
      },
      category: {
        type: "nét uốn lượn",
      },
      contrast_group: "contrast",
    },
    {
      id: "wrt_dong_song",
      label: "nét sóng nước",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🌊",
      },
      category: {
        type: "nét uốn lượn",
      },
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["nét cong tròn", "nét uốn lượn"],
      ordered: true,
    },
  },
  relations: [
    { type: "pair", source_id: "wrt_cong_kin", target_id: "wrt_qua_bong" },
    {
      type: "pair",
      source_id: "wrt_cong_ho_phai",
      target_id: "wrt_cong_ho_trai",
    },
    { type: "pair", source_id: "wrt_luon_song", target_id: "wrt_dong_song" },
    { type: "pair", source_id: "wrt_xoan_oc", target_id: "wrt_cau_vong" },
    { type: "contrast", source_id: "wrt_cong_kin", target_id: "wrt_luon_song" },
    {
      type: "contrast",
      source_id: "wrt_cong_ho_phai",
      target_id: "wrt_xoan_oc",
    },
    {
      type: "contrast",
      source_id: "wrt_cong_ho_trai",
      target_id: "wrt_cau_vong",
    },
    { type: "contrast", source_id: "wrt_qua_bong", target_id: "wrt_dong_song" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nét xiên, nét cong",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nét xiên, nét cong",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nét xiên, nét cong nhé",
  },
  ordering: [
    "wrt_cong_kin",
    "wrt_cong_ho_phai",
    "wrt_cong_ho_trai",
    "wrt_qua_bong",
    "wrt_luon_song",
    "wrt_xoan_oc",
    "wrt_cau_vong",
    "wrt_dong_song",
  ],
};

export const C5_WRT_03_SEED: SkillSeed = {
  identity: C5_WRT_03_IDENTITY,
  dataset: C5_WRT_03_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TAP-0006",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
  ],
};
