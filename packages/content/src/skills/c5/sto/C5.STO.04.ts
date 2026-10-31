import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_STO_04_IDENTITY: SkillIdentity = {
  code: "C5.STO.04",
  strand_code: "C5.STO",
  competency_code: "C5",
  name: "Nguyên nhân – kết quả trong truyện",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.INF.03"],
  learning_objectives: [
    {
      code: "LO-C5.STO.04-01",
      behaviour:
        "Nhận biết và thực hành Nguyên nhân – kết quả trong truyện ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.STO.04-02",
      behaviour:
        "Vận dụng Nguyên nhân – kết quả trong truyện trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.STO.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nguyên nhân – kết quả trong truyện",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_STO_04_DATASET: SkillDataset = {
  skill_code: "C5.STO.04",
  concept_label: "Nguyên nhân – kết quả trong truyện",
  surface: "game",
  items: [
    {
      id: "sto_troi_mua",
      label: "trời mưa đường ướt",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "cảnh tự nhiên",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "sto_nang_nong",
      label: "trời nắng tưới cây",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "cảnh tự nhiên",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "sto_gio_thoi",
      label: "gió thổi chong chóng",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "cảnh tự nhiên",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "sto_cham_chi",
      label: "chăm chỉ có ăn",
      image: {
        kind: "emoji",
        ref: "🐜",
      },
      category: {
        type: "việc làm tốt",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "sto_rua_thang",
      label: "kiên trì về đích",
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      category: {
        type: "việc làm tốt",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "sto_se_chia",
      label: "chia sẻ cùng vui",
      image: {
        kind: "emoji",
        ref: "🍰",
      },
      category: {
        type: "việc làm tốt",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nguyên nhân – kết quả trong truyện",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nguyên nhân – kết quả trong truyện",
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
      "Chúng mình cùng tìm hiểu về Nguyên nhân – kết quả trong truyện nhé",
  },
  ordering: [
    "sto_troi_mua",
    "sto_nang_nong",
    "sto_gio_thoi",
    "sto_cham_chi",
    "sto_rua_thang",
    "sto_se_chia",
  ],
  axes: {
    category: {
      values: ["cảnh tự nhiên", "việc làm tốt"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "sto_troi_mua",
      target_id: "sto_nang_nong",
    },
    {
      type: "pair",
      source_id: "sto_cham_chi",
      target_id: "sto_rua_thang",
    },
    {
      type: "contrast",
      source_id: "sto_troi_mua",
      target_id: "sto_cham_chi",
    },
  ],
};

export const C5_STO_04_SEED: SkillSeed = {
  identity: C5_STO_04_IDENTITY,
  dataset: C5_STO_04_DATASET,
  levels: [
    {
      code: "GL-C3-CAU-PAIR-0005",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C3-CAU-PAIR-0007",
      template: "GT-005",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
