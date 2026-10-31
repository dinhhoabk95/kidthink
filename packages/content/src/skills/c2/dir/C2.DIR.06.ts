import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_06_IDENTITY: SkillIdentity = {
  code: "C2.DIR.06",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Theo bản đồ",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "infer"],
  tier: "advanced",
  prerequisites: ["C2.DIR.05"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.06-01",
      behaviour: "Nhận biết và thực hành Theo bản đồ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.06-02",
      behaviour: "Vận dụng Theo bản đồ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Theo bản đồ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_06_DATASET: SkillDataset = {
  skill_code: "C2.DIR.06",
  concept_label: "Theo bản đồ",
  surface: "game",
  items: [
    {
      id: "sign_turn_left",
      label: "biển báo rẽ trái",
      image: {
        kind: "emoji",
        ref: "⬅️",
      },
      category: {
        type: "rẽ trái",
      },
      contrast_group: "turn_left",
      value: 1,
      ordering: 1,
    },
    {
      id: "bike_left",
      label: "xe đạp bên trái",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "rẽ trái",
      },
      contrast_group: "turn_left",
      value: 2,
      ordering: 2,
    },
    {
      id: "flag_left",
      label: "cờ hiệu bên trái",
      image: {
        kind: "emoji",
        ref: "🚩",
      },
      category: {
        type: "rẽ trái",
      },
      contrast_group: "turn_left",
      value: 3,
      ordering: 3,
    },
    {
      id: "traffic_light_left",
      label: "đèn tín hiệu bên trái",
      image: {
        kind: "emoji",
        ref: "🚦",
      },
      category: {
        type: "rẽ trái",
      },
      contrast_group: "turn_left",
      value: 4,
      ordering: 4,
    },
    {
      id: "sign_turn_right",
      label: "biển báo rẽ phải",
      image: {
        kind: "emoji",
        ref: "➡️",
      },
      category: {
        type: "rẽ phải",
      },
      contrast_group: "turn_right",
      value: 5,
      ordering: 5,
    },
    {
      id: "car_right",
      label: "ô tô đi làn bên phải",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "rẽ phải",
      },
      contrast_group: "turn_right",
      value: 6,
      ordering: 6,
    },
    {
      id: "tree_right",
      label: "hàng cây bên phải",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "rẽ phải",
      },
      contrast_group: "turn_right",
      value: 7,
      ordering: 7,
    },
    {
      id: "house_right",
      label: "ngôi nhà bên phải",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "rẽ phải",
      },
      contrast_group: "turn_right",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "sign_turn_left",
      target_id: "sign_turn_right",
    },
    {
      type: "pair",
      source_id: "bike_left",
      target_id: "car_right",
    },
    {
      type: "pair",
      source_id: "flag_left",
      target_id: "tree_right",
    },
    {
      type: "pair",
      source_id: "traffic_light_left",
      target_id: "house_right",
    },
    {
      type: "contrast",
      source_id: "sign_turn_left",
      target_id: "sign_turn_right",
    },
  ],
  axes: {
    category: {
      values: ["rẽ trái", "rẽ phải"],
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
      description: "Làm quen cơ bản với Theo bản đồ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Theo bản đồ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Theo bản đồ nhé",
  },
  ordering: [
    "sign_turn_left",
    "bike_left",
    "flag_left",
    "traffic_light_left",
    "sign_turn_right",
    "car_right",
    "tree_right",
    "house_right",
  ],
};

export const C2_DIR_06_SEED: SkillSeed = {
  identity: C2_DIR_06_IDENTITY,
  dataset: C2_DIR_06_DATASET,
  levels: [
    {
      code: "GL-C3-RNK-ORD-0007",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C3-RNK-ORD-0008",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-TRACE-0001",
      template: "GT-024",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
