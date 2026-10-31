import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DES_01_IDENTITY: SkillIdentity = {
  code: "C5.DES.01",
  strand_code: "C5.DES",
  competency_code: "C5",
  name: "Miêu tả một vật",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["describe", "observe"],
  tier: "basic",
  prerequisites: ["C4.DET.01"],
  learning_objectives: [
    {
      code: "LO-C5.DES.01-01",
      behaviour: "Nhận biết và thực hành Miêu tả một vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DES.01-02",
      behaviour: "Vận dụng Miêu tả một vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DES.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Miêu tả một vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DES_01_DATASET: SkillDataset = {
  skill_code: "C5.DES.01",
  concept_label: "Miêu tả một vật",
  surface: "game",
  items: [
    {
      id: "des_qua_bong",
      label: "quả bóng đá tròn",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "đồ chơi bé",
        label: "Đồ chơi của bé",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "des_xe_o_to",
      label: "xe ô tô xanh",
      image: {
        kind: "emoji",
        ref: "🚙",
      },
      category: {
        type: "đồ chơi bé",
        label: "Đồ chơi của bé",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "des_gau_bong",
      label: "gấu bông nâu",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "đồ chơi bé",
        label: "Đồ chơi của bé",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "des_dong_ho",
      label: "đồng hồ báo thức",
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      category: {
        type: "đồ dùng quen",
        label: "Đồ dùng quen thuộc",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "des_hop_qua",
      label: "hộp quà xinh",
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "đồ dùng quen",
        label: "Đồ dùng quen thuộc",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "des_chiec_mu",
      label: "chiếc mũ xanh",
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      category: {
        type: "đồ dùng quen",
        label: "Đồ dùng quen thuộc",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "des_qua_bong",
      target_id: "des_xe_o_to",
      explanation: "cùng là đồ chơi quen thuộc",
    },
    {
      type: "pair",
      source_id: "des_dong_ho",
      target_id: "des_hop_qua",
      explanation: "cùng là đồ dùng quen thuộc",
    },
    {
      type: "contrast",
      source_id: "des_qua_bong",
      target_id: "des_dong_ho",
      explanation: "đồ chơi đối lập với đồ dùng",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Miêu tả một vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Miêu tả một vật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Miêu tả một vật nhé",
  },
  ordering: [
    "des_qua_bong",
    "des_xe_o_to",
    "des_gau_bong",
    "des_dong_ho",
    "des_hop_qua",
    "des_chiec_mu",
  ],
};

export const C5_DES_01_SEED: SkillSeed = {
  identity: C5_DES_01_IDENTITY,
  dataset: C5_DES_01_DATASET,
  levels: [
    {
      code: "GL-C5-EXP-CMP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-SEQ-0014",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-EXP-CMP-0017",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
