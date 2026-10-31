import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_STO_01_IDENTITY: SkillIdentity = {
  code: "C5.STO.01",
  strand_code: "C5.STO",
  competency_code: "C5",
  name: "Kể lại chuyện vừa nghe",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["recall", "describe"],
  tier: "core",
  prerequisites: ["C5.LIS.01"],
  learning_objectives: [
    {
      code: "LO-C5.STO.01-01",
      behaviour: "Nhận biết và thực hành Kể lại chuyện vừa nghe ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.STO.01-02",
      behaviour: "Vận dụng Kể lại chuyện vừa nghe trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.STO.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Kể lại chuyện vừa nghe",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_STO_01_DATASET: SkillDataset = {
  skill_code: "C5.STO.01",
  concept_label: "Kể lại chuyện vừa nghe",
  surface: "game",
  items: [
    {
      id: "sto_cuu_nho",
      label: "cừu nhỏ đi dạo",
      image: {
        kind: "emoji",
        ref: "🐑",
      },
      category: {
        type: "mở đầu truyện",
      },
      value: 1,
      ordering: 1,
      contrast_group: "primary",
    },
    {
      id: "sto_nang_dep",
      label: "buổi sáng nắng đẹp",
      image: {
        kind: "emoji",
        ref: "🌅",
      },
      category: {
        type: "mở đầu truyện",
      },
      value: 2,
      ordering: 2,
      contrast_group: "primary",
    },
    {
      id: "sto_ngam_hoa",
      label: "cừu mải ngắm hoa",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "mở đầu truyện",
      },
      value: 3,
      ordering: 3,
      contrast_group: "primary",
    },
    {
      id: "sto_do_mua",
      label: "trời bỗng đổ mưa",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "kết thúc truyện",
      },
      value: 4,
      ordering: 4,
      contrast_group: "contrast",
    },
    {
      id: "sto_me_don",
      label: "mẹ mang ô đón",
      image: {
        kind: "emoji",
        ref: "☂️",
      },
      category: {
        type: "kết thúc truyện",
      },
      value: 5,
      ordering: 5,
      contrast_group: "contrast",
    },
    {
      id: "sto_ve_nha",
      label: "hai mẹ con về nhà",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "kết thúc truyện",
      },
      value: 6,
      ordering: 6,
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Kể lại chuyện vừa nghe",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Kể lại chuyện vừa nghe",
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
      "Chúng mình cùng tìm hiểu về Kể lại chuyện vừa nghe nhé",
  },
  ordering: [
    "sto_cuu_nho",
    "sto_nang_dep",
    "sto_ngam_hoa",
    "sto_do_mua",
    "sto_me_don",
    "sto_ve_nha",
  ],
  axes: {
    category: {
      values: ["mở đầu truyện", "kết thúc truyện"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "sequence",
      source_id: "sto_cuu_nho",
      target_id: "sto_nang_dep",
    },
    {
      type: "sequence",
      source_id: "sto_do_mua",
      target_id: "sto_me_don",
    },
    {
      type: "pair",
      source_id: "sto_cuu_nho",
      target_id: "sto_nang_dep",
    },
    {
      type: "contrast",
      source_id: "sto_cuu_nho",
      target_id: "sto_do_mua",
    },
  ],
};

export const C5_STO_01_SEED: SkillSeed = {
  identity: C5_STO_01_IDENTITY,
  dataset: C5_STO_01_DATASET,
  levels: [
    {
      code: "GL-C5-STO-INTRO-0001",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.STO.01"],
    },
    {
      code: "GL-C5-STO-CARD-0001",
      template: "GT-012",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-BOX-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-BOX-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SEQ-0008",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-LOC-0009",
      template: "GT-022",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-SUB-FAST-0010",
      template: "GT-012",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-LOC-0015",
      template: "GT-022",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-STO-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
  ],
};
