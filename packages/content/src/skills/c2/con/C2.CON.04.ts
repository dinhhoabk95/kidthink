import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_CON_04_IDENTITY: SkillIdentity = {
  code: "C2.CON.04",
  strand_code: "C2.CON",
  competency_code: "C2",
  name: "Ghép khối 3D",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["create", "infer"],
  tier: "advanced",
  prerequisites: ["C2.CON.03"],
  learning_objectives: [
    {
      code: "LO-C2.CON.04-01",
      behaviour: "Nhận biết và thực hành Ghép khối 3D ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.CON.04-02",
      behaviour: "Vận dụng Ghép khối 3D trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.CON.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép khối 3D",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_CON_04_DATASET: SkillDataset = {
  skill_code: "C2.CON.04",
  concept_label: "Ghép khối 3D",
  surface: "game",
  items: [
    {
      id: "cube_wood",
      label: "khối lập phương",
      image: {
        kind: "emoji",
        ref: "🧊",
      },
      category: {
        type: "khối gỗ",
      },
      contrast_group: "block",
      value: 1,
      ordering: 1,
    },
    {
      id: "cylinder_wood",
      label: "khối trụ tròn",
      image: {
        kind: "emoji",
        ref: "🥫",
      },
      category: {
        type: "khối gỗ",
      },
      contrast_group: "block",
      value: 2,
      ordering: 2,
    },
    {
      id: "sphere_wood",
      label: "khối cầu tròn",
      image: {
        kind: "emoji",
        ref: "🔮",
      },
      category: {
        type: "khối gỗ",
      },
      contrast_group: "block",
      value: 3,
      ordering: 3,
    },
    {
      id: "pyramid_wood",
      label: "khối chóp nhọn",
      image: {
        kind: "emoji",
        ref: "⛺",
      },
      category: {
        type: "khối gỗ",
      },
      contrast_group: "block",
      value: 4,
      ordering: 4,
    },
    {
      id: "arch_bridge",
      label: "cầu vòm gỗ",
      image: {
        kind: "emoji",
        ref: "🌉",
      },
      category: {
        type: "mô hình",
      },
      contrast_group: "model",
      value: 5,
      ordering: 5,
    },
    {
      id: "arch_house",
      label: "nhà gỗ mái vòm",
      image: {
        kind: "emoji",
        ref: "🏛️",
      },
      category: {
        type: "mô hình",
      },
      contrast_group: "model",
      value: 6,
      ordering: 6,
    },
    {
      id: "arch_tower",
      label: "tháp canh cao tầng",
      image: {
        kind: "emoji",
        ref: "🏢",
      },
      category: {
        type: "mô hình",
      },
      contrast_group: "model",
      value: 7,
      ordering: 7,
    },
    {
      id: "arch_gate",
      label: "cổng thành cổ",
      image: {
        kind: "emoji",
        ref: "⛩️",
      },
      category: {
        type: "mô hình",
      },
      contrast_group: "model",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "cube_wood",
      target_id: "arch_bridge",
    },
    {
      type: "pair",
      source_id: "cylinder_wood",
      target_id: "arch_house",
    },
    {
      type: "pair",
      source_id: "sphere_wood",
      target_id: "arch_tower",
    },
    {
      type: "pair",
      source_id: "pyramid_wood",
      target_id: "arch_gate",
    },
    {
      type: "contrast",
      source_id: "cube_wood",
      target_id: "arch_bridge",
    },
  ],
  axes: {
    category: {
      values: ["khối gỗ", "mô hình"],
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
      description: "Làm quen cơ bản với Ghép khối 3D",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ghép khối 3D",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ghép khối 3D nhé",
  },
  ordering: [
    "cube_wood",
    "cylinder_wood",
    "sphere_wood",
    "pyramid_wood",
    "arch_bridge",
    "arch_house",
    "arch_tower",
    "arch_gate",
  ],
};

export const C2_CON_04_SEED: SkillSeed = {
  identity: C2_CON_04_IDENTITY,
  dataset: C2_CON_04_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C3-RNK-ORD-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C3-RNK-ORD-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-TOW-STK-0001",
      template: "GT-023",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-TOW-STK-0002",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-TOW-STK-0003",
      template: "GT-023",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C2-CON-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 2,
      theme: "home",
    },
    {
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
    {
      template: "GT-032",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
  ],
};
