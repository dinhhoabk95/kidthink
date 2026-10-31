import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_01_IDENTITY: SkillIdentity = {
  code: "C5.VOC.01",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng động vật",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.01-01",
      behaviour: "Nhận biết và thực hành Từ vựng động vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.01-02",
      behaviour: "Vận dụng Từ vựng động vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Từ vựng động vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_01_DATASET: SkillDataset = {
  skill_code: "C5.VOC.01",
  concept_label: "Từ vựng động vật",
  surface: "game",
  items: [
    {
      id: "voc_cho",
      label: "con chó",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "thú bốn chân",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "voc_meo",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "thú bốn chân",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "voc_lon",
      label: "con lợn",
      image: {
        kind: "emoji",
        ref: "🐷",
      },
      category: {
        type: "thú bốn chân",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "voc_bo",
      label: "con bò",
      image: {
        kind: "emoji",
        ref: "🐮",
      },
      category: {
        type: "thú bốn chân",
      },
      value: 4,
      contrast_group: "primary",
    },
    {
      id: "voc_tho",
      label: "con thỏ",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "thú nhỏ chim",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "voc_cuu",
      label: "con cừu",
      image: {
        kind: "emoji",
        ref: "🐑",
      },
      category: {
        type: "thú nhỏ chim",
      },
      value: 6,
      contrast_group: "contrast",
    },
    {
      id: "voc_ga",
      label: "con gà",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "thú nhỏ chim",
      },
      value: 7,
      contrast_group: "contrast",
    },
    {
      id: "voc_vit",
      label: "con vịt",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "thú nhỏ chim",
      },
      value: 8,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["thú bốn chân", "thú nhỏ chim"],
      ordered: true,
    },
  },
  relations: [
    { type: "pair", source_id: "voc_cho", target_id: "voc_meo" },
    { type: "pair", source_id: "voc_lon", target_id: "voc_bo" },
    { type: "pair", source_id: "voc_tho", target_id: "voc_cuu" },
    { type: "pair", source_id: "voc_ga", target_id: "voc_vit" },
    { type: "contrast", source_id: "voc_cho", target_id: "voc_tho" },
    { type: "contrast", source_id: "voc_meo", target_id: "voc_cuu" },
    { type: "contrast", source_id: "voc_lon", target_id: "voc_ga" },
    { type: "contrast", source_id: "voc_bo", target_id: "voc_vit" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Từ vựng động vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng động vật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Từ vựng động vật nhé",
  },
  ordering: [
    "voc_cho",
    "voc_meo",
    "voc_lon",
    "voc_bo",
    "voc_tho",
    "voc_cuu",
    "voc_ga",
    "voc_vit",
  ],
};

export const C5_VOC_01_SEED: SkillSeed = {
  identity: C5_VOC_01_IDENTITY,
  dataset: C5_VOC_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C5-VOC-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
  ],
};
