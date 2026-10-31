import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_02_IDENTITY: SkillIdentity = {
  code: "C5.VOC.02",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng trái cây",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.02-01",
      behaviour: "Nhận biết và thực hành Từ vựng trái cây ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.02-02",
      behaviour: "Vận dụng Từ vựng trái cây trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Từ vựng trái cây",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_02_DATASET: SkillDataset = {
  skill_code: "C5.VOC.02",
  concept_label: "Từ vựng trái cây",
  surface: "game",
  items: [
    {
      id: "voc_tao",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "quả mềm ngọt",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "voc_chuoi",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "quả mềm ngọt",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "voc_nho",
      label: "chùm nho",
      image: {
        kind: "emoji",
        ref: "🍇",
      },
      category: {
        type: "quả mềm ngọt",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "voc_dau_tay",
      label: "quả dâu tây",
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "quả mềm ngọt",
      },
      value: 4,
      contrast_group: "primary",
    },
    {
      id: "voc_cam",
      label: "quả cam",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "quả vỏ dày",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "voc_dua_hau",
      label: "quả dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "quả vỏ dày",
      },
      value: 6,
      contrast_group: "contrast",
    },
    {
      id: "voc_dua",
      label: "quả dứa",
      image: {
        kind: "emoji",
        ref: "🍍",
      },
      category: {
        type: "quả vỏ dày",
      },
      value: 7,
      contrast_group: "contrast",
    },
    {
      id: "voc_dao",
      label: "quả đào",
      image: {
        kind: "emoji",
        ref: "🍑",
      },
      category: {
        type: "quả vỏ dày",
      },
      value: 8,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["quả mềm ngọt", "quả vỏ dày"],
      ordered: true,
    },
  },
  relations: [
    { type: "pair", source_id: "voc_tao", target_id: "voc_chuoi" },
    { type: "pair", source_id: "voc_nho", target_id: "voc_dau_tay" },
    { type: "pair", source_id: "voc_cam", target_id: "voc_dua_hau" },
    { type: "pair", source_id: "voc_dua", target_id: "voc_dao" },
    { type: "contrast", source_id: "voc_tao", target_id: "voc_cam" },
    { type: "contrast", source_id: "voc_chuoi", target_id: "voc_dua_hau" },
    { type: "contrast", source_id: "voc_nho", target_id: "voc_dua" },
    { type: "contrast", source_id: "voc_dau_tay", target_id: "voc_dao" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Từ vựng trái cây",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng trái cây",
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
    narration_template: "Chúng mình cùng tìm hiểu về Từ vựng trái cây nhé",
  },
  ordering: [
    "voc_tao",
    "voc_chuoi",
    "voc_nho",
    "voc_dau_tay",
    "voc_cam",
    "voc_dua_hau",
    "voc_dua",
    "voc_dao",
  ],
};

export const C5_VOC_02_SEED: SkillSeed = {
  identity: C5_VOC_02_IDENTITY,
  dataset: C5_VOC_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C5-VOC-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-PATT-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MEMO-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
  ],
};
