import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_CON_02_IDENTITY: SkillIdentity = {
  code: "C2.CON.02",
  strand_code: "C2.CON",
  competency_code: "C2",
  name: "Ghép hình nghệ thuật",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["solve", "plan"],
  tier: "advanced",
  prerequisites: ["C2.CON.01", "C2.ROT.04"],
  learning_objectives: [
    {
      code: "LO-C2.CON.02-01",
      behaviour: "Nhận biết và thực hành Tangram ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.CON.02-02",
      behaviour: "Vận dụng Tangram trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.CON.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tangram",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_CON_02_DATASET: SkillDataset = {
  skill_code: "C2.CON.02",
  concept_label: "Ghép hình nghệ thuật",
  surface: "game",
  items: [
    {
      id: "tangram_triangle_big",
      label: "tam giác lớn",
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
      id: "tangram_square",
      label: "khối vuông nhỏ",
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
      id: "tangram_rhombus",
      label: "hình thoi cam",
      image: {
        kind: "emoji",
        ref: "🔶",
      },
      category: {
        type: "mảnh ghép",
      },
      contrast_group: "piece",
      value: 3,
      ordering: 3,
    },
    {
      id: "tangram_triangle_small",
      label: "tam giác nhỏ",
      image: {
        kind: "emoji",
        ref: "🔻",
      },
      category: {
        type: "mảnh ghép",
      },
      contrast_group: "piece",
      value: 4,
      ordering: 4,
    },
    {
      id: "tangram_cat",
      label: "chú mèo ghép",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "hình mẫu",
      },
      contrast_group: "model",
      value: 5,
      ordering: 5,
    },
    {
      id: "tangram_bird",
      label: "chú chim ghép",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "hình mẫu",
      },
      contrast_group: "model",
      value: 6,
      ordering: 6,
    },
    {
      id: "tangram_fish",
      label: "con cá ghép",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "hình mẫu",
      },
      contrast_group: "model",
      value: 7,
      ordering: 7,
    },
    {
      id: "tangram_house",
      label: "ngôi nhà ghép",
      image: {
        kind: "emoji",
        ref: "🏡",
      },
      category: {
        type: "hình mẫu",
      },
      contrast_group: "model",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "tangram_triangle_big",
      target_id: "tangram_cat",
    },
    {
      type: "pair",
      source_id: "tangram_square",
      target_id: "tangram_bird",
    },
    {
      type: "pair",
      source_id: "tangram_rhombus",
      target_id: "tangram_fish",
    },
    {
      type: "pair",
      source_id: "tangram_triangle_small",
      target_id: "tangram_house",
    },
    {
      type: "contrast",
      source_id: "tangram_triangle_big",
      target_id: "tangram_cat",
    },
  ],
  axes: {
    category: {
      values: ["mảnh ghép", "hình mẫu"],
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
      description: "Làm quen cơ bản với ghép hình nghệ thuật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng ghép hình nghệ thuật",
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
    narration_template: "Chúng mình cùng ghép hình nghệ thuật thật khéo nhé",
  },
  ordering: [
    "tangram_triangle_big",
    "tangram_square",
    "tangram_rhombus",
    "tangram_triangle_small",
    "tangram_cat",
    "tangram_bird",
    "tangram_fish",
    "tangram_house",
  ],
};

export const C2_CON_02_SEED: SkillSeed = {
  identity: C2_CON_02_IDENTITY,
  dataset: C2_CON_02_DATASET,
  levels: [
    {
      code: "GL-C2-PRJ-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-PRJ-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-SHP-BSK-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-SHP-BSK-0006",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C2-SHP-BSK-0007",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C3-RNK-ORD-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C3-RNK-ORD-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C3-RNK-ORD-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-HOL-SLOT-0007",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-HOL-SLOT-0008",
      template: "GT-008",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-SHAD-0001",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
  ],
};
