import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_GRM_03_IDENTITY: SkillIdentity = {
  code: "C5.GRM.03",
  strand_code: "C5.GRM",
  competency_code: "C5",
  name: "Từ nối: và · rồi · nhưng · vì",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["describe", "infer"],
  tier: "advanced",
  prerequisites: ["C5.GRM.01"],
  learning_objectives: [
    {
      code: "LO-C5.GRM.03-01",
      behaviour:
        "Nhận biết và thực hành Từ nối: và · rồi · nhưng · vì ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.GRM.03-02",
      behaviour:
        "Vận dụng Từ nối: và · rồi · nhưng · vì trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.GRM.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Từ nối: và · rồi · nhưng · vì",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_GRM_03_DATASET: SkillDataset = {
  skill_code: "C5.GRM.03",
  concept_label: "Từ nối: và · rồi · nhưng · vì",
  surface: "game",
  items: [
    {
      id: "grm_tu_noi_va",
      label: "từ và",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "từ nối thêm vào",
        label: "Từ nối thêm vào",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "grm_tu_noi_roi",
      label: "từ rồi",
      image: {
        kind: "emoji",
        ref: "🧼",
      },
      category: {
        type: "từ nối thêm vào",
        label: "Từ nối thêm vào",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "grm_tu_noi_voi",
      label: "từ với",
      image: {
        kind: "emoji",
        ref: "🤝",
      },
      category: {
        type: "từ nối thêm vào",
        label: "Từ nối thêm vào",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "grm_tu_noi_nhung",
      label: "từ nhưng",
      image: {
        kind: "emoji",
        ref: "⛅",
      },
      category: {
        type: "từ nối lý do",
        label: "Từ nối chỉ lý do",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "grm_tu_noi_vi",
      label: "từ vì",
      image: {
        kind: "emoji",
        ref: "😊",
      },
      category: {
        type: "từ nối lý do",
        label: "Từ nối chỉ lý do",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "grm_tu_noi_nen",
      label: "từ nên",
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      category: {
        type: "từ nối lý do",
        label: "Từ nối chỉ lý do",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "grm_tu_noi_va",
      target_id: "grm_tu_noi_roi",
      explanation: "cùng là từ nối thêm vào",
    },
    {
      type: "pair",
      source_id: "grm_tu_noi_nhung",
      target_id: "grm_tu_noi_vi",
      explanation: "cùng là từ nối chỉ lý do",
    },
    {
      type: "contrast",
      source_id: "grm_tu_noi_va",
      target_id: "grm_tu_noi_nhung",
      explanation: "từ nối thêm vào đối lập với từ nối chỉ lý do",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Từ nối: và · rồi · nhưng · vì",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ nối: và · rồi · nhưng · vì",
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
      "Chúng mình cùng tìm hiểu về Từ nối: và · rồi · nhưng · vì nhé",
  },
  ordering: [
    "grm_tu_noi_va",
    "grm_tu_noi_roi",
    "grm_tu_noi_voi",
    "grm_tu_noi_nhung",
    "grm_tu_noi_vi",
    "grm_tu_noi_nen",
  ],
};

export const C5_GRM_03_SEED: SkillSeed = {
  identity: C5_GRM_03_IDENTITY,
  dataset: C5_GRM_03_DATASET,
  levels: [
    {
      code: "GL-C5-GRM-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
  ],
};
