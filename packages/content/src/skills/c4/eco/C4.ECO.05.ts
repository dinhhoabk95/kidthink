import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_ECO_05_IDENTITY: SkillIdentity = {
  code: "C4.ECO.05",
  strand_code: "C4.ECO",
  competency_code: "C4",
  name: "Vật dùng lại được",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "create"],
  tier: "advanced",
  prerequisites: ["C4.ECO.03"],
  learning_objectives: [
    {
      code: "LO-C4.ECO.05-01",
      behaviour: "Nhận biết và thực hành Vật dùng lại được ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.ECO.05-02",
      behaviour: "Vận dụng Vật dùng lại được trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.ECO.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Vật dùng lại được",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_ECO_05_DATASET: SkillDataset = {
  skill_code: "C4.ECO.05",
  concept_label: "Vật dùng lại được",
  surface: "game",
  items: [
    {
      id: "mat_cloth_bag",
      label: "chiếc túi vải",
      image: {
        kind: "emoji",
        ref: "👜",
      },
      category: {
        type: "dùng nhiều lần",
      },
      contrast_group: "reusable",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/mat_cloth_bag.mp3",
    },
    {
      id: "mat_glass_cup",
      label: "cốc thủy tinh",
      image: {
        kind: "emoji",
        ref: "🫙",
      },
      category: {
        type: "dùng nhiều lần",
      },
      contrast_group: "reusable",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/mat_glass_cup.mp3",
    },
    {
      id: "mat_lunch_box",
      label: "hộp cơm nhựa",
      image: {
        kind: "emoji",
        ref: "🍱",
      },
      category: {
        type: "dùng nhiều lần",
      },
      contrast_group: "reusable",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/mat_lunch_box.mp3",
    },
    {
      id: "mat_metal_straw",
      label: "đôi đũa gỗ",
      image: {
        kind: "emoji",
        ref: "🥢",
      },
      category: {
        type: "dùng nhiều lần",
      },
      contrast_group: "reusable",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/mat_metal_straw.mp3",
    },
    {
      id: "mat_plastic_bag",
      label: "túi nilon mỏng",
      image: {
        kind: "emoji",
        ref: "🛍️",
      },
      category: {
        type: "dùng một lần",
      },
      contrast_group: "disposable",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/mat_plastic_bag.mp3",
    },
    {
      id: "mat_paper_cup",
      label: "cốc giấy mỏng",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "dùng một lần",
      },
      contrast_group: "disposable",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/mat_paper_cup.mp3",
    },
    {
      id: "mat_straw",
      label: "hộp giấy xốp",
      image: {
        kind: "emoji",
        ref: "🥡",
      },
      category: {
        type: "dùng một lần",
      },
      contrast_group: "disposable",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/mat_straw.mp3",
    },
    {
      id: "mat_tissue",
      label: "khăn giấy ăn",
      image: {
        kind: "emoji",
        ref: "🧻",
      },
      category: {
        type: "dùng một lần",
      },
      contrast_group: "disposable",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/mat_tissue.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "mat_cloth_bag",
      target_id: "mat_plastic_bag",
    },
    {
      type: "contrast",
      source_id: "mat_glass_cup",
      target_id: "mat_paper_cup",
    },
    {
      type: "contrast",
      source_id: "mat_lunch_box",
      target_id: "mat_straw",
    },
    {
      type: "contrast",
      source_id: "mat_metal_straw",
      target_id: "mat_tissue",
    },
  ],
  axes: {
    reuse_ability: {
      values: ["dùng nhiều lần", "dùng một lần"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Vật dùng lại được",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Vật dùng lại được",
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
    narration_template: "Chúng mình cùng tìm hiểu về Vật dùng lại được nhé",
  },
  ordering: [
    "mat_cloth_bag",
    "mat_glass_cup",
    "mat_lunch_box",
    "mat_metal_straw",
    "mat_plastic_bag",
    "mat_paper_cup",
    "mat_straw",
    "mat_tissue",
  ],
};

export const C4_ECO_05_SEED: SkillSeed = {
  identity: C4_ECO_05_IDENTITY,
  dataset: C4_ECO_05_DATASET,
  levels: [
    {
      code: "GL-C4-ECO-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
