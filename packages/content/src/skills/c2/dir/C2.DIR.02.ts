import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_02_IDENTITY: SkillIdentity = {
  code: "C2.DIR.02",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Đi xuống",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["plan"],
  tier: "basic",
  prerequisites: ["C2.ORI.04"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.02-01",
      behaviour: "Nhận biết và thực hành Đi xuống ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.02-02",
      behaviour: "Vận dụng Đi xuống trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đi xuống",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_02_DATASET: SkillDataset = {
  skill_code: "C2.DIR.02",
  concept_label: "Đi xuống",
  surface: "game",
  items: [
    {
      id: "arrow_down",
      label: "mũi tên chỉ xuống",
      image: {
        kind: "emoji",
        ref: "⬇️",
      },
      category: {
        type: "đi xuống",
      },
      contrast_group: "down",
      value: 1,
      ordering: 1,
    },
    {
      id: "slide_down",
      label: "trượt cầu trượt xuống",
      image: {
        kind: "emoji",
        ref: "🛝",
      },
      category: {
        type: "đi xuống",
      },
      contrast_group: "down",
      value: 2,
      ordering: 2,
    },
    {
      id: "leaf_down",
      label: "chiếc lá rơi xuống",
      image: {
        kind: "emoji",
        ref: "🍂",
      },
      category: {
        type: "đi xuống",
      },
      contrast_group: "down",
      value: 3,
      ordering: 3,
    },
    {
      id: "rain_down",
      label: "hạt mưa rơi xuống",
      image: {
        kind: "emoji",
        ref: "💧",
      },
      category: {
        type: "đi xuống",
      },
      contrast_group: "down",
      value: 4,
      ordering: 4,
    },
    {
      id: "arrow_up",
      label: "mũi tên đi lên",
      image: {
        kind: "emoji",
        ref: "⬆️",
      },
      category: {
        type: "đi lên",
      },
      contrast_group: "up",
      value: 5,
      ordering: 5,
    },
    {
      id: "rocket_up",
      label: "tên lửa bay lên",
      image: {
        kind: "emoji",
        ref: "🚀",
      },
      category: {
        type: "đi lên",
      },
      contrast_group: "up",
      value: 6,
      ordering: 6,
    },
    {
      id: "balloon_up",
      label: "bóng bay lên cao",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "đi lên",
      },
      contrast_group: "up",
      value: 7,
      ordering: 7,
    },
    {
      id: "heli_up",
      label: "trực thăng bay lên",
      image: {
        kind: "emoji",
        ref: "🚁",
      },
      category: {
        type: "đi lên",
      },
      contrast_group: "up",
      value: 8,
      ordering: 8,
    },
    {
      id: "moonlight_stream",
      label: "bờ suối ánh trăng",
      image: {
        kind: "emoji",
        ref: "🌊",
      },
      category: {
        type: "đi xuống",
      },
      contrast_group: "down",
      value: 9,
      ordering: 9,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "arrow_down",
      target_id: "arrow_up",
    },
    {
      type: "pair",
      source_id: "slide_down",
      target_id: "rocket_up",
    },
    {
      type: "pair",
      source_id: "leaf_down",
      target_id: "balloon_up",
    },
    {
      type: "pair",
      source_id: "rain_down",
      target_id: "heli_up",
    },
    {
      type: "contrast",
      source_id: "arrow_down",
      target_id: "arrow_up",
    },
  ],
  axes: {
    category: {
      values: ["đi xuống", "đi lên"],
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
      description: "Làm quen cơ bản với Đi xuống",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đi xuống",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đi xuống nhé",
  },
  ordering: [
    "arrow_down",
    "slide_down",
    "leaf_down",
    "rain_down",
    "arrow_up",
    "rocket_up",
    "balloon_up",
    "heli_up",
    "moonlight_stream",
  ],
};

export const C2_DIR_02_SEED: SkillSeed = {
  identity: C2_DIR_02_IDENTITY,
  dataset: C2_DIR_02_DATASET,
  levels: [
    {
      code: "GL-C2-DIR-SHAD-0006",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0007",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-GRID-0006",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-MAZE-0182",
      template: "GT-013",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB09-D1",
    },
  ],
};
