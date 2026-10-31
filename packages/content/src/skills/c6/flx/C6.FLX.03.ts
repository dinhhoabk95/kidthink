import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_FLX_03_IDENTITY: SkillIdentity = {
  code: "C6.FLX.03",
  strand_code: "C6.FLX",
  competency_code: "C6",
  name: "Chuyển giữa hai nhiệm vụ",
  age_min: 5,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["shift", "plan"],
  tier: "advanced",
  prerequisites: ["C6.FLX.01"],
  learning_objectives: [
    {
      code: "LO-C6.FLX.03-01",
      behaviour: "Nhận biết và thực hành Chuyển giữa hai nhiệm vụ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.FLX.03-02",
      behaviour: "Vận dụng Chuyển giữa hai nhiệm vụ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.FLX.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chuyển giữa hai nhiệm vụ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_FLX_03_DATASET: SkillDataset = {
  skill_code: "C6.FLX.03",
  concept_label: "Chuyển giữa hai nhiệm vụ",
  surface: "game",
  items: [
    {
      id: "red_ladybug",
      label: "bọ rùa đỏ",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🐞",
      },
      category: {
        type: "động vật",
        color: "red",
        shape: "circle",
      },
      contrast_group: "animals",
    },
    {
      id: "blue_fish",
      label: "chú cá xanh",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "động vật",
        color: "blue",
        shape: "square",
      },
      contrast_group: "animals",
    },
    {
      id: "yellow_chick",
      label: "gà con vàng",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "🐥",
      },
      category: {
        type: "động vật",
        color: "yellow",
        shape: "triangle",
      },
      contrast_group: "animals",
    },
    {
      id: "green_frog",
      label: "chú ếch xanh",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "🐸",
      },
      category: {
        type: "động vật",
        color: "green",
        shape: "star",
      },
      contrast_group: "animals",
    },
    {
      id: "red_car",
      label: "ô tô đỏ",
      value: 5,
      ordering: 5,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "phương tiện",
        color: "red",
        shape: "circle",
      },
      contrast_group: "vehicles",
    },
    {
      id: "blue_suv",
      label: "xe hơi xanh",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "🚙",
      },
      category: {
        type: "phương tiện",
        color: "blue",
        shape: "square",
      },
      contrast_group: "vehicles",
    },
    {
      id: "yellow_taxi",
      label: "xe vàng",
      value: 7,
      ordering: 7,
      image: {
        kind: "emoji",
        ref: "🚕",
      },
      category: {
        type: "phương tiện",
        color: "yellow",
        shape: "triangle",
      },
      contrast_group: "vehicles",
    },
    {
      id: "green_bike",
      label: "xe đạp xanh",
      value: 8,
      ordering: 8,
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "phương tiện",
        color: "green",
        shape: "star",
      },
      contrast_group: "vehicles",
    },
  ],
  axes: {
    type: ["động vật", "phương tiện"],
    color: ["red", "blue", "yellow", "green"],
    shape: ["circle", "square", "triangle", "star"],
  },
  relations: [
    {
      type: "pair",
      source_id: "red_ladybug",
      target_id: "red_car",
      metadata: { dimension: "color" },
    },
    {
      type: "pair",
      source_id: "blue_fish",
      target_id: "blue_suv",
      metadata: { dimension: "color" },
    },
    {
      type: "pair",
      source_id: "yellow_chick",
      target_id: "yellow_taxi",
      metadata: { dimension: "color" },
    },
    {
      type: "pair",
      source_id: "green_frog",
      target_id: "green_bike",
      metadata: { dimension: "color" },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chuyển giữa hai nhiệm vụ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chuyển giữa hai nhiệm vụ",
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
      "Chúng mình cùng linh hoạt chuyển nhiệm vụ khi chơi nhé",
  },
  ordering: [
    "red_ladybug",
    "blue_fish",
    "yellow_chick",
    "green_frog",
    "red_car",
    "blue_suv",
    "yellow_taxi",
    "green_bike",
  ],
};

export const C6_FLX_03_SEED: SkillSeed = {
  identity: C6_FLX_03_IDENTITY,
  dataset: C6_FLX_03_DATASET,
  levels: [
    {
      code: "GL-C3-BLG-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C3-MUL-BSK-0006",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C6-FLX-PUZZ-0007",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
  ],
};
