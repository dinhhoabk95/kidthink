import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_05_IDENTITY: SkillIdentity = {
  code: "C2.DIR.05",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Theo mũi tên",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "plan"],
  tier: "basic",
  prerequisites: ["C2.DIR.01", "C2.DIR.02"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.05-01",
      behaviour: "Nhận biết và thực hành Theo mũi tên ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.05-02",
      behaviour: "Vận dụng Theo mũi tên trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Theo mũi tên",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_05_DATASET: SkillDataset = {
  skill_code: "C2.DIR.05",
  concept_label: "Theo mũi tên",
  surface: "game",
  items: [
    {
      id: "arrow_up",
      label: "mũi tên chỉ lên",
      image: {
        kind: "emoji",
        ref: "⬆️",
      },
      category: {
        type: "mũi tên hướng",
      },
      contrast_group: "arrow_sign",
      value: 1,
      ordering: 1,
    },
    {
      id: "arrow_down",
      label: "mũi tên chỉ xuống",
      image: {
        kind: "emoji",
        ref: "⬇️",
      },
      category: {
        type: "mũi tên hướng",
      },
      contrast_group: "arrow_sign",
      value: 2,
      ordering: 2,
    },
    {
      id: "arrow_left",
      label: "mũi tên chỉ trái",
      image: {
        kind: "emoji",
        ref: "⬅️",
      },
      category: {
        type: "mũi tên hướng",
      },
      contrast_group: "arrow_sign",
      value: 3,
      ordering: 3,
    },
    {
      id: "arrow_right",
      label: "mũi tên chỉ phải",
      image: {
        kind: "emoji",
        ref: "➡️",
      },
      category: {
        type: "mũi tên hướng",
      },
      contrast_group: "arrow_sign",
      value: 4,
      ordering: 4,
    },
    {
      id: "rocket_follow",
      label: "tên lửa bay lên",
      image: {
        kind: "emoji",
        ref: "🚀",
      },
      category: {
        type: "đi theo hướng",
      },
      contrast_group: "follow_vehicle",
      value: 5,
      ordering: 5,
    },
    {
      id: "anchor_follow",
      label: "mỏ neo thả xuống",
      image: {
        kind: "emoji",
        ref: "⚓",
      },
      category: {
        type: "đi theo hướng",
      },
      contrast_group: "follow_vehicle",
      value: 6,
      ordering: 6,
    },
    {
      id: "car_follow",
      label: "ô tô chạy sang trái",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "đi theo hướng",
      },
      contrast_group: "follow_vehicle",
      value: 7,
      ordering: 7,
    },
    {
      id: "bus_follow",
      label: "xe buýt chạy sang phải",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "đi theo hướng",
      },
      contrast_group: "follow_vehicle",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "arrow_up",
      target_id: "rocket_follow",
    },
    {
      type: "pair",
      source_id: "arrow_down",
      target_id: "anchor_follow",
    },
    {
      type: "pair",
      source_id: "arrow_left",
      target_id: "car_follow",
    },
    {
      type: "pair",
      source_id: "arrow_right",
      target_id: "bus_follow",
    },
    {
      type: "contrast",
      source_id: "arrow_up",
      target_id: "rocket_follow",
    },
  ],
  axes: {
    category: {
      values: ["mũi tên hướng", "đi theo hướng"],
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
      description: "Làm quen cơ bản với Theo mũi tên",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Theo mũi tên",
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
    narration_template: "Chúng mình cùng tìm hiểu về Theo mũi tên nhé",
  },
  ordering: [
    "arrow_up",
    "arrow_down",
    "arrow_left",
    "arrow_right",
    "rocket_follow",
    "anchor_follow",
    "car_follow",
    "bus_follow",
  ],
};

export const C2_DIR_05_SEED: SkillSeed = {
  identity: C2_DIR_05_IDENTITY,
  dataset: C2_DIR_05_DATASET,
  levels: [
    {
      code: "GL-C2-DIR-NAV-0010",
      template: "GT-022",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-NAV-0016",
      template: "GT-022",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
  ],
};
