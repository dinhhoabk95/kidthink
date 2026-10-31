import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_GRM_02_IDENTITY: SkillIdentity = {
  code: "C5.GRM.02",
  strand_code: "C5.GRM",
  competency_code: "C5",
  name: "Trật tự từ trong câu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["sequence", "verify"],
  tier: "advanced",
  prerequisites: ["C5.GRM.01", "C3.SEQ.01"],
  learning_objectives: [
    {
      code: "LO-C5.GRM.02-01",
      behaviour: "Nhận biết và thực hành Trật tự từ trong câu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.GRM.02-02",
      behaviour: "Vận dụng Trật tự từ trong câu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.GRM.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Trật tự từ trong câu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_GRM_02_DATASET: SkillDataset = {
  skill_code: "C5.GRM.02",
  concept_label: "Trật tự từ trong câu",
  surface: "game",
  items: [
    {
      id: "grm_thuc_day",
      label: "buổi sáng thức dậy",
      image: {
        kind: "emoji",
        ref: "🌅",
      },
      category: {
        type: "việc ở nhà",
        label: "Việc ở nhà",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "grm_danh_rang",
      label: "bé đánh răng sạch",
      image: {
        kind: "emoji",
        ref: "🪥",
      },
      category: {
        type: "việc ở nhà",
        label: "Việc ở nhà",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "grm_an_sang",
      label: "bé ăn sáng ngon",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "việc ở nhà",
        label: "Việc ở nhà",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "grm_khoac_ba_lo",
      label: "bé khoác ba lô",
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "việc đến trường",
        label: "Việc đến trường",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "grm_di_xe",
      label: "bố đưa đến trường",
      image: {
        kind: "emoji",
        ref: "🛵",
      },
      category: {
        type: "việc đến trường",
        label: "Việc đến trường",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "grm_chao_co",
      label: "bé chào cô giáo",
      image: {
        kind: "emoji",
        ref: "🏫",
      },
      category: {
        type: "việc đến trường",
        label: "Việc đến trường",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  axes: {
    category: {
      values: ["việc ở nhà", "việc đến trường"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "sequence",
      source_id: "grm_thuc_day",
      target_id: "grm_danh_rang",
      explanation: "thức dậy rồi đến đánh răng",
    },
    {
      type: "pair",
      source_id: "grm_thuc_day",
      target_id: "grm_danh_rang",
      explanation: "cùng là hoạt động chuẩn bị ở nhà",
    },
    {
      type: "contrast",
      source_id: "grm_thuc_day",
      target_id: "grm_chao_co",
      explanation: "việc ở nhà đối lập với việc ở trường",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Trật tự từ trong câu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trật tự từ trong câu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trật tự từ trong câu nhé",
  },
  ordering: [
    "grm_thuc_day",
    "grm_danh_rang",
    "grm_an_sang",
    "grm_khoac_ba_lo",
    "grm_di_xe",
    "grm_chao_co",
  ],
};

export const C5_GRM_02_SEED: SkillSeed = {
  identity: C5_GRM_02_IDENTITY,
  dataset: C5_GRM_02_DATASET,
  levels: [
    {
      code: "GL-C5-GRM-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-GRM-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
  ],
};
