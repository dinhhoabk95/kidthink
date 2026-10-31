import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_06_IDENTITY: SkillIdentity = {
  code: "C5.WRT.06",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Viết tên mình",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["recall", "create"],
  tier: "advanced",
  prerequisites: ["C5.WRT.05", "C5.ALP.02"],
  learning_objectives: [
    {
      code: "LO-C5.WRT.06-01",
      behaviour: "Nhận biết và thực hành Viết tên mình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.06-02",
      behaviour: "Vận dụng Viết tên mình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Viết tên mình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_06_DATASET: SkillDataset = {
  skill_code: "C5.WRT.06",
  concept_label: "Viết tên mình",
  surface: "game",
  items: [
    {
      id: "wrt_chu_cai_dau",
      label: "chữ cái đầu tên",
      image: {
        kind: "emoji",
        ref: "🔤",
      },
      category: {
        type: "nhận biết tên",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "wrt_the_ten",
      label: "thẻ tên của bé",
      image: {
        kind: "emoji",
        ref: "🏷️",
      },
      category: {
        type: "nhận biết tên",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "wrt_bien_ten",
      label: "bảng tên cài áo",
      image: {
        kind: "emoji",
        ref: "📛",
      },
      category: {
        type: "nhận biết tên",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "wrt_ngoi_sao_khen",
      label: "ngôi sao điểm tốt",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "nhận biết tên",
      },
      value: 4,
      contrast_group: "primary",
    },
    {
      id: "wrt_to_ten_minh",
      label: "tô theo tên bé",
      image: {
        kind: "emoji",
        ref: "✍️",
      },
      category: {
        type: "tập viết tên",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "wrt_viet_ten_tren_vo",
      label: "viết tên lên vở",
      image: {
        kind: "emoji",
        ref: "📓",
      },
      category: {
        type: "tập viết tên",
      },
      value: 6,
      contrast_group: "contrast",
    },
    {
      id: "wrt_chuc_mung",
      label: "viết tên lên thiệp",
      image: {
        kind: "emoji",
        ref: "💌",
      },
      category: {
        type: "tập viết tên",
      },
      value: 7,
      contrast_group: "contrast",
    },
    {
      id: "wrt_hop_but",
      label: "ghi tên vào hộp bút",
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "tập viết tên",
      },
      value: 8,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["nhận biết tên", "tập viết tên"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "wrt_chu_cai_dau",
      target_id: "wrt_the_ten",
    },
    {
      type: "pair",
      source_id: "wrt_bien_ten",
      target_id: "wrt_ngoi_sao_khen",
    },
    {
      type: "pair",
      source_id: "wrt_to_ten_minh",
      target_id: "wrt_viet_ten_tren_vo",
    },
    {
      type: "pair",
      source_id: "wrt_chuc_mung",
      target_id: "wrt_hop_but",
    },
    {
      type: "contrast",
      source_id: "wrt_chu_cai_dau",
      target_id: "wrt_to_ten_minh",
    },
    {
      type: "contrast",
      source_id: "wrt_the_ten",
      target_id: "wrt_viet_ten_tren_vo",
    },
    {
      type: "contrast",
      source_id: "wrt_bien_ten",
      target_id: "wrt_chuc_mung",
    },
    {
      type: "contrast",
      source_id: "wrt_ngoi_sao_khen",
      target_id: "wrt_hop_but",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Viết tên mình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Viết tên mình",
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
    narration_template: "Chúng mình cùng tìm hiểu về Viết tên mình nhé",
  },
  ordering: [
    "wrt_chu_cai_dau",
    "wrt_the_ten",
    "wrt_bien_ten",
    "wrt_ngoi_sao_khen",
    "wrt_to_ten_minh",
    "wrt_viet_ten_tren_vo",
    "wrt_chuc_mung",
    "wrt_hop_but",
  ],
};

export const C5_WRT_06_SEED: SkillSeed = {
  identity: C5_WRT_06_IDENTITY,
  dataset: C5_WRT_06_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-PATT-0011",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PATT-0012",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-MEMO-0001",
      template: "GT-012",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
