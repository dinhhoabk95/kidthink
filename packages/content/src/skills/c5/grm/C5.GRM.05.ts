import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_GRM_05_IDENTITY: SkillIdentity = {
  code: "C5.GRM.05",
  strand_code: "C5.GRM",
  competency_code: "C5",
  name: "Từ chỉ vị trí, từ chỉ số nhiều",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["describe", "match"],
  tier: "advanced",
  prerequisites: ["C5.GRM.01", "C2.ORI.07"],
  learning_objectives: [
    {
      code: "LO-C5.GRM.05-01",
      behaviour:
        "Nhận biết và thực hành Từ chỉ vị trí, từ chỉ số nhiều ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.GRM.05-02",
      behaviour:
        "Vận dụng Từ chỉ vị trí, từ chỉ số nhiều trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.GRM.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Từ chỉ vị trí, từ chỉ số nhiều",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_GRM_05_DATASET: SkillDataset = {
  skill_code: "C5.GRM.05",
  concept_label: "Từ chỉ vị trí, từ chỉ số nhiều",
  surface: "game",
  items: [
    {
      id: "grm_vi_tri_tren",
      label: "ở trên",
      image: {
        kind: "emoji",
        ref: "🔝",
      },
      category: {
        type: "từ chỉ vị trí",
        label: "Từ chỉ vị trí",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "grm_vi_tri_duoi",
      label: "ở dưới",
      image: {
        kind: "emoji",
        ref: "⬇️",
      },
      category: {
        type: "từ chỉ vị trí",
        label: "Từ chỉ vị trí",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "grm_vi_tri_trong",
      label: "ở trong",
      image: {
        kind: "emoji",
        ref: "📦",
      },
      category: {
        type: "từ chỉ vị trí",
        label: "Từ chỉ vị trí",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "grm_so_luong_nhieu",
      label: "nhiều chim",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "từ chỉ số nhiều",
        label: "Từ chỉ số nhiều",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "grm_so_luong_cac",
      label: "các bạn",
      image: {
        kind: "emoji",
        ref: "🧒",
      },
      category: {
        type: "từ chỉ số nhiều",
        label: "Từ chỉ số nhiều",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "grm_so_luong_dan",
      label: "đàn cá",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "từ chỉ số nhiều",
        label: "Từ chỉ số nhiều",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "grm_vi_tri_tren",
      target_id: "grm_vi_tri_duoi",
      explanation: "cùng là từ chỉ vị trí",
    },
    {
      type: "pair",
      source_id: "grm_so_luong_nhieu",
      target_id: "grm_so_luong_cac",
      explanation: "cùng là từ chỉ số nhiều",
    },
    {
      type: "contrast",
      source_id: "grm_vi_tri_tren",
      target_id: "grm_so_luong_nhieu",
      explanation: "từ chỉ vị trí đối lập với từ chỉ số lượng",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Từ chỉ vị trí, từ chỉ số nhiều",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ chỉ vị trí, từ chỉ số nhiều",
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
      "Chúng mình cùng tìm hiểu về Từ chỉ vị trí, từ chỉ số nhiều nhé",
  },
  ordering: [
    "grm_vi_tri_tren",
    "grm_vi_tri_duoi",
    "grm_vi_tri_trong",
    "grm_so_luong_nhieu",
    "grm_so_luong_cac",
    "grm_so_luong_dan",
  ],
};

export const C5_GRM_05_SEED: SkillSeed = {
  identity: C5_GRM_05_IDENTITY,
  dataset: C5_GRM_05_DATASET,
  levels: [
    {
      code: "GL-C5-GRM-TAP-0003",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SLOT-0003",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SLOT-0004",
      template: "GT-008",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
