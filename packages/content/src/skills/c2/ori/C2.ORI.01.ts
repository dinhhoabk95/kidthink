import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_01_IDENTITY: SkillIdentity = {
  code: "C2.ORI.01",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Trái",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.ORI.01-01",
      behaviour: "Nhận biết và thực hành Trái ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.01-02",
      behaviour: "Vận dụng Trái trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Trái",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_01_DATASET: SkillDataset = {
  skill_code: "C2.ORI.01",
  concept_label: "Trái",
  surface: "game",
  items: [
    {
      id: "arrow_left",
      label: "mũi tên bên trái",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⬅️",
      },
      category: {
        type: "ở bên trái",
      },
      contrast_group: "left",
    },
    {
      id: "hand_left",
      label: "bàn tay bên trái",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🤚",
      },
      category: {
        type: "ở bên trái",
      },
      contrast_group: "left",
    },
    {
      id: "car_left",
      label: "ô tô bên trái",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "ở bên trái",
      },
      contrast_group: "left",
    },
    {
      id: "dolphin_left",
      label: "cá heo bên trái",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🐬",
      },
      category: {
        type: "ở bên trái",
      },
      contrast_group: "left",
    },
    {
      id: "arrow_right",
      label: "mũi tên bên phải",
      value: 5,
      image: {
        kind: "emoji",
        ref: "➡️",
      },
      category: {
        type: "ở bên phải",
      },
      contrast_group: "right",
    },
    {
      id: "hand_right",
      label: "bàn tay bên phải",
      value: 6,
      image: {
        kind: "emoji",
        ref: "✋",
      },
      category: {
        type: "ở bên phải",
      },
      contrast_group: "right",
    },
    {
      id: "train_right",
      label: "tàu hỏa bên phải",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🚄",
      },
      category: {
        type: "ở bên phải",
      },
      contrast_group: "right",
    },
    {
      id: "runner_right",
      label: "người chạy bên phải",
      value: 8,
      image: {
        kind: "emoji",
        ref: "🏃",
      },
      category: {
        type: "ở bên phải",
      },
      contrast_group: "right",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "arrow_left",
      target_id: "arrow_right",
      metadata: {
        dimension: "direction",
      },
    },
    {
      type: "contrast",
      source_id: "hand_left",
      target_id: "hand_right",
      metadata: {
        dimension: "direction",
      },
    },
    {
      type: "pair",
      source_id: "arrow_left",
      target_id: "car_left",
      metadata: {
        relation: "cùng bên trái",
      },
    },
    {
      type: "pair",
      source_id: "arrow_right",
      target_id: "train_right",
      metadata: {
        relation: "cùng bên phải",
      },
    },
  ],
  axes: {
    orientation: {
      values: ["ở bên trái", "ở bên phải"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Trái",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trái",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trái nhé",
  },
  ordering: [
    "arrow_left",
    "hand_left",
    "car_left",
    "dolphin_left",
    "arrow_right",
    "hand_right",
    "train_right",
    "runner_right",
  ],
};

export const C2_ORI_01_SEED: SkillSeed = {
  identity: C2_ORI_01_IDENTITY,
  dataset: C2_ORI_01_DATASET,
  levels: [
    {
      code: "GL-C2-ROT-SHP-0001",
      template: "GT-019",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-SHP-0002",
      template: "GT-019",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C2-ROT-SHP-0003",
      template: "GT-019",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
  ],
};
