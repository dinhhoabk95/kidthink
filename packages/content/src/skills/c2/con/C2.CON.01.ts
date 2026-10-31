import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_CON_01_IDENTITY: SkillIdentity = {
  code: "C2.CON.01",
  strand_code: "C2.CON",
  competency_code: "C2",
  name: "Xếp hình theo mẫu",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["match", "observe"],
  tier: "basic",
  prerequisites: ["C2.GEO.01"],
  learning_objectives: [
    {
      code: "LO-C2.CON.01-01",
      behaviour: "Nhận biết và thực hành Xếp hình theo mẫu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.CON.01-02",
      behaviour: "Vận dụng Xếp hình theo mẫu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.CON.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Xếp hình theo mẫu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_CON_01_DATASET: SkillDataset = {
  skill_code: "C2.CON.01",
  concept_label: "Xếp hình theo mẫu",
  surface: "game",
  items: [
    {
      id: "piece_triangle",
      label: "mảnh tam giác",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "mảnh ghép",
      },
      contrast_group: "piece",
      value: 1,
      ordering: 1,
    },
    {
      id: "piece_square",
      label: "mảnh vuông",
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "mảnh ghép",
      },
      contrast_group: "piece",
      value: 2,
      ordering: 2,
    },
    {
      id: "piece_circle",
      label: "mảnh tròn",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "mảnh ghép",
      },
      contrast_group: "piece",
      value: 3,
      ordering: 3,
    },
    {
      id: "piece_rectangle",
      label: "mảnh chữ nhật",
      image: {
        kind: "emoji",
        ref: "🟧",
      },
      category: {
        type: "mảnh ghép",
      },
      contrast_group: "piece",
      value: 4,
      ordering: 4,
    },
    {
      id: "model_house",
      label: "ngôi nhà ghép",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "hình ghép",
      },
      contrast_group: "model",
      value: 5,
      ordering: 5,
    },
    {
      id: "model_boat",
      label: "thuyền buồm ghép",
      image: {
        kind: "emoji",
        ref: "⛵",
      },
      category: {
        type: "hình ghép",
      },
      contrast_group: "model",
      value: 6,
      ordering: 6,
    },
    {
      id: "model_rocket",
      label: "tên lửa ghép",
      image: {
        kind: "emoji",
        ref: "🚀",
      },
      category: {
        type: "hình ghép",
      },
      contrast_group: "model",
      value: 7,
      ordering: 7,
    },
    {
      id: "model_car",
      label: "ô tô ghép",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "hình ghép",
      },
      contrast_group: "model",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "piece_triangle",
      target_id: "model_house",
    },
    {
      type: "pair",
      source_id: "piece_square",
      target_id: "model_boat",
    },
    {
      type: "pair",
      source_id: "piece_circle",
      target_id: "model_rocket",
    },
    {
      type: "pair",
      source_id: "piece_rectangle",
      target_id: "model_car",
    },
    {
      type: "contrast",
      source_id: "piece_triangle",
      target_id: "model_house",
    },
  ],
  axes: {
    category: {
      values: ["mảnh ghép", "hình ghép"],
    },
    order: {
      values: ["1", "2", "3", "4", "5", "6", "7", "8"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Xếp hình theo mẫu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Xếp hình theo mẫu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Xếp hình theo mẫu nhé",
  },
  ordering: [
    "piece_triangle",
    "piece_square",
    "piece_circle",
    "piece_rectangle",
    "model_house",
    "model_boat",
    "model_rocket",
    "model_car",
  ],
};

export const C2_CON_01_SEED: SkillSeed = {
  identity: C2_CON_01_IDENTITY,
  dataset: C2_CON_01_DATASET,
  levels: [
    {
      code: "GL-C2-TNG-SHP-0006",
      template: "GT-023",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-TNG-SHP-0007",
      template: "GT-023",
      band: "5-6",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-TNG-SHP-0008",
      template: "GT-023",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
  ],
};
