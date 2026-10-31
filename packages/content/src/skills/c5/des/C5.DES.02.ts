import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DES_02_IDENTITY: SkillIdentity = {
  code: "C5.DES.02",
  strand_code: "C5.DES",
  competency_code: "C5",
  name: "Miêu tả một bức tranh",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["describe", "observe"],
  tier: "core",
  prerequisites: ["C5.DES.01"],
  learning_objectives: [
    {
      code: "LO-C5.DES.02-01",
      behaviour: "Nhận biết và thực hành Miêu tả một bức tranh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DES.02-02",
      behaviour: "Vận dụng Miêu tả một bức tranh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DES.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Miêu tả một bức tranh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DES_02_DATASET: SkillDataset = {
  skill_code: "C5.DES.02",
  concept_label: "Miêu tả một bức tranh",
  surface: "game",
  items: [
    {
      id: "des_dong_lua",
      label: "cánh đồng lúa",
      image: {
        kind: "emoji",
        ref: "🌾",
      },
      category: {
        type: "cảnh thiên nhiên",
        label: "Cảnh thiên nhiên",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "des_bai_bien",
      label: "bãi biển xanh",
      image: {
        kind: "emoji",
        ref: "🏖️",
      },
      category: {
        type: "cảnh thiên nhiên",
        label: "Cảnh thiên nhiên",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "des_vuon_hoa",
      label: "vườn hoa tươi",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "cảnh thiên nhiên",
        label: "Cảnh thiên nhiên",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "des_truong_hoc",
      label: "trường học vui",
      image: {
        kind: "emoji",
        ref: "🏫",
      },
      category: {
        type: "cảnh sinh hoạt",
        label: "Cảnh sinh hoạt",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "des_bau_troi_dem",
      label: "bầu trời sao",
      image: {
        kind: "emoji",
        ref: "🌌",
      },
      category: {
        type: "cảnh sinh hoạt",
        label: "Cảnh sinh hoạt",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "des_cong_vien",
      label: "công viên mát",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "cảnh sinh hoạt",
        label: "Cảnh sinh hoạt",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "des_dong_lua",
      target_id: "des_bai_bien",
      explanation: "cùng là cảnh vật thiên nhiên",
    },
    {
      type: "pair",
      source_id: "des_truong_hoc",
      target_id: "des_bau_troi_dem",
      explanation: "cùng là cảnh vật sinh hoạt đời sống",
    },
    {
      type: "contrast",
      source_id: "des_dong_lua",
      target_id: "des_truong_hoc",
      explanation: "cảnh thiên nhiên đối lập với cảnh trường lớp",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Miêu tả một bức tranh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Miêu tả một bức tranh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Miêu tả một bức tranh nhé",
  },
  ordering: [
    "des_dong_lua",
    "des_bai_bien",
    "des_vuon_hoa",
    "des_truong_hoc",
    "des_bau_troi_dem",
    "des_cong_vien",
  ],
};

export const C5_DES_02_SEED: SkillSeed = {
  identity: C5_DES_02_IDENTITY,
  dataset: C5_DES_02_DATASET,
  levels: [
    {
      code: "GL-C5-DES-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-DES-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
  ],
};
