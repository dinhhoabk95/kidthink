import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_MAZ_01_IDENTITY: SkillIdentity = {
  code: "C2.MAZ.01",
  strand_code: "C2.MAZ",
  competency_code: "C2",
  name: "Mê cung một đường",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["plan"],
  tier: "basic",
  prerequisites: ["C2.DIR.05"],
  learning_objectives: [
    {
      code: "LO-C2.MAZ.01-01",
      behaviour: "Nhận biết và thực hành Mê cung một đường ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.MAZ.01-02",
      behaviour: "Vận dụng Mê cung một đường trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.MAZ.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Mê cung một đường",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_MAZ_01_DATASET: SkillDataset = {
  skill_code: "C2.MAZ.01",
  concept_label: "Mê cung một đường",
  surface: "game",
  items: [
    {
      id: "finish_nest",
      label: "tổ chim ấm êm",
      image: {
        kind: "emoji",
        ref: "🪺",
      },
      category: {
        type: "điểm đích",
      },
      contrast_group: "path_node",
      value: 1,
      ordering: 1,
    },
    {
      id: "finish_honey",
      label: "hũ mật ong ngọt",
      image: {
        kind: "emoji",
        ref: "🍯",
      },
      category: {
        type: "điểm đích",
      },
      contrast_group: "path_node",
      value: 2,
      ordering: 2,
    },
    {
      id: "finish_carrot",
      label: "củ cà rốt ngon",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "điểm đích",
      },
      contrast_group: "path_node",
      value: 3,
      ordering: 3,
    },
    {
      id: "finish_cheese",
      label: "miếng phô mai thơm",
      image: {
        kind: "emoji",
        ref: "🧀",
      },
      category: {
        type: "điểm đích",
      },
      contrast_group: "path_node",
      value: 4,
      ordering: 4,
    },
    {
      id: "barrier_hedge",
      label: "bụi cây gai rậm",
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      category: {
        type: "vật cản",
      },
      contrast_group: "obstacle",
      value: 5,
      ordering: 5,
    },
    {
      id: "barrier_boulder",
      label: "khối đá chắn lối",
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "vật cản",
      },
      contrast_group: "obstacle",
      value: 6,
      ordering: 6,
    },
    {
      id: "barrier_puddle",
      label: "khúc gỗ chắn đường",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "vật cản",
      },
      contrast_group: "obstacle",
      value: 7,
      ordering: 7,
    },
    {
      id: "barrier_gate",
      label: "cánh cửa chắn lối",
      image: {
        kind: "emoji",
        ref: "🚪",
      },
      category: {
        type: "vật cản",
      },
      contrast_group: "obstacle",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "finish_nest",
      target_id: "barrier_hedge",
    },
    {
      type: "pair",
      source_id: "finish_honey",
      target_id: "barrier_boulder",
    },
    {
      type: "pair",
      source_id: "finish_carrot",
      target_id: "barrier_puddle",
    },
    {
      type: "pair",
      source_id: "finish_cheese",
      target_id: "barrier_gate",
    },
    {
      type: "contrast",
      source_id: "finish_nest",
      target_id: "barrier_hedge",
    },
  ],
  axes: {
    category: {
      values: ["điểm đích", "vật cản"],
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
      description: "Làm quen cơ bản với Mê cung một đường",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Mê cung một đường",
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
    narration_template: "Chúng mình cùng tìm hiểu về Mê cung một đường nhé",
  },
  ordering: [
    "finish_nest",
    "finish_honey",
    "finish_carrot",
    "finish_cheese",
    "barrier_hedge",
    "barrier_boulder",
    "barrier_puddle",
    "barrier_gate",
  ],
};

export const C2_MAZ_01_SEED: SkillSeed = {
  identity: C2_MAZ_01_IDENTITY,
  dataset: C2_MAZ_01_DATASET,
  levels: [
    {
      code: "GL-C2-MAZ-PATH-0001",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-PATH-0002",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-LOG-0001",
      template: "GT-013",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
  ],
};
