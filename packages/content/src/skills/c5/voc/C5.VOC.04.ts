import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_04_IDENTITY: SkillIdentity = {
  code: "C5.VOC.04",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng gia đình",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.04-01",
      behaviour: "Nhận biết và thực hành Từ vựng gia đình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.04-02",
      behaviour: "Vận dụng Từ vựng gia đình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Từ vựng gia đình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_04_DATASET: SkillDataset = {
  skill_code: "C5.VOC.04",
  concept_label: "Từ vựng gia đình",
  surface: "game",
  items: [
    {
      id: "voc_ong",
      label: "ông",
      image: {
        kind: "emoji",
        ref: "👴",
      },
      category: {
        type: "người lớn nhà",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "voc_ba",
      label: "bà",
      image: {
        kind: "emoji",
        ref: "👵",
      },
      category: {
        type: "người lớn nhà",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "voc_bo",
      label: "bố",
      image: {
        kind: "emoji",
        ref: "👨",
      },
      category: {
        type: "người lớn nhà",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "voc_me",
      label: "mẹ",
      image: {
        kind: "emoji",
        ref: "👩",
      },
      category: {
        type: "người lớn nhà",
      },
      value: 4,
      contrast_group: "primary",
    },
    {
      id: "voc_anh",
      label: "anh trai",
      image: {
        kind: "emoji",
        ref: "👦",
      },
      category: {
        type: "anh chị em",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "voc_chi",
      label: "chị gái",
      image: {
        kind: "emoji",
        ref: "👧",
      },
      category: {
        type: "anh chị em",
      },
      value: 6,
      contrast_group: "contrast",
    },
    {
      id: "voc_em",
      label: "em trai",
      image: {
        kind: "emoji",
        ref: "🧒",
      },
      category: {
        type: "anh chị em",
      },
      value: 7,
      contrast_group: "contrast",
    },
    {
      id: "voc_be",
      label: "em bé",
      image: {
        kind: "emoji",
        ref: "👶",
      },
      category: {
        type: "anh chị em",
      },
      value: 8,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["người lớn nhà", "anh chị em"],
      ordered: true,
    },
  },
  relations: [
    { type: "pair", source_id: "voc_ong", target_id: "voc_ba" },
    { type: "pair", source_id: "voc_bo", target_id: "voc_me" },
    { type: "pair", source_id: "voc_anh", target_id: "voc_chi" },
    { type: "pair", source_id: "voc_em", target_id: "voc_be" },
    { type: "contrast", source_id: "voc_ong", target_id: "voc_anh" },
    { type: "contrast", source_id: "voc_ba", target_id: "voc_chi" },
    { type: "contrast", source_id: "voc_bo", target_id: "voc_em" },
    { type: "contrast", source_id: "voc_me", target_id: "voc_be" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Từ vựng gia đình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng gia đình",
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
    narration_template: "Chúng mình cùng tìm hiểu về Từ vựng gia đình nhé",
  },
  ordering: [
    "voc_ong",
    "voc_ba",
    "voc_bo",
    "voc_me",
    "voc_anh",
    "voc_chi",
    "voc_em",
    "voc_be",
  ],
};

export const C5_VOC_04_SEED: SkillSeed = {
  identity: C5_VOC_04_IDENTITY,
  dataset: C5_VOC_04_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0008",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TCMP-0007",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
  ],
};
