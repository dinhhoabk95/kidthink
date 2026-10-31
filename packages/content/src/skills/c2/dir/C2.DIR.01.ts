import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_DIR_01_IDENTITY: SkillIdentity = {
  code: "C2.DIR.01",
  strand_code: "C2.DIR",
  competency_code: "C2",
  name: "Đi lên",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["plan"],
  tier: "basic",
  prerequisites: ["C2.ORI.03"],
  learning_objectives: [
    {
      code: "LO-C2.DIR.01-01",
      behaviour: "Nhận biết và thực hành Đi lên ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.DIR.01-02",
      behaviour: "Vận dụng Đi lên trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.DIR.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đi lên",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_DIR_01_DATASET: SkillDataset = {
  skill_code: "C2.DIR.01",
  concept_label: "Đi lên",
  surface: "game",
  items: [
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
      value: 1,
      ordering: 1,
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
      value: 2,
      ordering: 2,
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
      value: 3,
      ordering: 3,
    },
    {
      id: "ladder_up",
      label: "leo thang đi lên",
      image: {
        kind: "emoji",
        ref: "🪜",
      },
      category: {
        type: "đi lên",
      },
      contrast_group: "up",
      value: 4,
      ordering: 4,
    },
    {
      id: "arrow_down",
      label: "mũi tên đi xuống",
      image: {
        kind: "emoji",
        ref: "⬇️",
      },
      category: {
        type: "đi xuống",
      },
      contrast_group: "down",
      value: 5,
      ordering: 5,
    },
    {
      id: "leaf_down",
      label: "lá vàng rơi xuống",
      image: {
        kind: "emoji",
        ref: "🍂",
      },
      category: {
        type: "đi xuống",
      },
      contrast_group: "down",
      value: 6,
      ordering: 6,
    },
    {
      id: "rain_down",
      label: "giọt mưa rơi xuống",
      image: {
        kind: "emoji",
        ref: "💧",
      },
      category: {
        type: "đi xuống",
      },
      contrast_group: "down",
      value: 7,
      ordering: 7,
    },
    {
      id: "anchor_down",
      label: "mỏ neo thả xuống",
      image: {
        kind: "emoji",
        ref: "⚓",
      },
      category: {
        type: "đi xuống",
      },
      contrast_group: "down",
      value: 8,
      ordering: 8,
    },
    {
      id: "cave_lantern",
      label: "chiếc đèn hang đá",
      image: {
        kind: "emoji",
        ref: "🏮",
      },
      category: {
        type: "đi lên",
      },
      contrast_group: "up",
      value: 9,
      ordering: 9,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "arrow_up",
      target_id: "arrow_down",
    },
    {
      type: "pair",
      source_id: "rocket_up",
      target_id: "leaf_down",
    },
    {
      type: "pair",
      source_id: "balloon_up",
      target_id: "rain_down",
    },
    {
      type: "pair",
      source_id: "ladder_up",
      target_id: "anchor_down",
    },
    {
      type: "contrast",
      source_id: "arrow_up",
      target_id: "arrow_down",
    },
  ],
  axes: {
    category: {
      values: ["đi lên", "đi xuống"],
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
      description: "Làm quen cơ bản với Đi lên",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đi lên",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đi lên nhé",
  },
  ordering: [
    "arrow_up",
    "rocket_up",
    "balloon_up",
    "ladder_up",
    "arrow_down",
    "leaf_down",
    "rain_down",
    "anchor_down",
    "cave_lantern",
  ],
};

export const C2_DIR_01_SEED: SkillSeed = {
  identity: C2_DIR_01_IDENTITY,
  dataset: C2_DIR_01_DATASET,
  levels: [
    {
      code: "GL-C2-DIR-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-DIR-MAZE-0181",
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
