import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_03_IDENTITY: SkillIdentity = {
  code: "C2.DIR.03",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Rẽ trái",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["plan", "shift"],
  tier: "core",
  prerequisites: ["C2.ORI.01"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.03-01",
      behaviour: "Nhận biết và thực hành Rẽ trái ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.03-02",
      behaviour: "Vận dụng Rẽ trái trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Rẽ trái",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_03_DATASET: SkillDataset = {
  skill_code: "C2.DIR.03",
  concept_label: "Rẽ trái",
  surface: "game",
  items: [
    {
      id: "arrow_left",
      label: "mũi tên rẽ trái",
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
      id: "car_left",
      label: "ô tô rẽ trái",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "rẽ trái",
      },
      contrast_group: "turn_left",
      value: 2,
      ordering: 2,
    },
    {
      id: "bike_left",
      label: "xe đạp rẽ trái",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "rẽ trái",
      },
      contrast_group: "turn_left",
      value: 3,
      ordering: 3,
    },
    {
      id: "fish_left",
      label: "cá bơi sang trái",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "rẽ trái",
      },
      contrast_group: "turn_left",
      value: 4,
      ordering: 4,
    },
    {
      id: "arrow_right",
      label: "mũi tên rẽ phải",
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
      id: "bus_right",
      label: "xe buýt rẽ phải",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "rẽ phải",
      },
      contrast_group: "turn_right",
      value: 6,
      ordering: 6,
    },
    {
      id: "scooter_right",
      label: "xe trượt rẽ phải",
      image: {
        kind: "emoji",
        ref: "🛴",
      },
      category: {
        type: "rẽ phải",
      },
      contrast_group: "turn_right",
      value: 7,
      ordering: 7,
    },
    {
      id: "dog_right",
      label: "cún chạy sang phải",
      image: {
        kind: "emoji",
        ref: "🐕",
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
      source_id: "arrow_left",
      target_id: "arrow_right",
    },
    {
      type: "pair",
      source_id: "car_left",
      target_id: "bus_right",
    },
    {
      type: "pair",
      source_id: "bike_left",
      target_id: "scooter_right",
    },
    {
      type: "pair",
      source_id: "fish_left",
      target_id: "dog_right",
    },
    {
      type: "contrast",
      source_id: "arrow_left",
      target_id: "arrow_right",
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
      description: "Làm quen cơ bản với Rẽ trái",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Rẽ trái",
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
    narration_template: "Chúng mình cùng tìm hiểu về Rẽ trái nhé",
  },
  ordering: [
    "arrow_left",
    "car_left",
    "bike_left",
    "fish_left",
    "arrow_right",
    "bus_right",
    "scooter_right",
    "dog_right",
  ],
};

export const C2_DIR_03_SEED: SkillSeed = {
  identity: C2_DIR_03_IDENTITY,
  dataset: C2_DIR_03_DATASET,
  levels: [
    {
      code: "GL-C2-DIR-SHAD-0011",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0012",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
  ],
};
