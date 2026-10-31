import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_02_IDENTITY: SkillIdentity = {
  code: "C2.ORI.02",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Phải",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.ORI.02-01",
      behaviour: "Nhận biết và thực hành Phải ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.02-02",
      behaviour: "Vận dụng Phải trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Phải",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_02_DATASET: SkillDataset = {
  skill_code: "C2.ORI.02",
  concept_label: "Phải",
  surface: "game",
  items: [
    {
      id: "glove_right",
      label: "găng tay bên phải",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🧤",
      },
      category: {
        type: "ở bên phải",
      },
      contrast_group: "right",
    },
    {
      id: "shoe_right",
      label: "chiếc giày bên phải",
      value: 2,
      image: {
        kind: "emoji",
        ref: "👟",
      },
      category: {
        type: "ở bên phải",
      },
      contrast_group: "right",
    },
    {
      id: "bus_right",
      label: "xe buýt bên phải",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "ở bên phải",
      },
      contrast_group: "right",
    },
    {
      id: "arrow_right",
      label: "mũi tên bên phải",
      value: 4,
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
      id: "sock_left",
      label: "chiếc tất bên trái",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🧦",
      },
      category: {
        type: "ở bên trái",
      },
      contrast_group: "left",
    },
    {
      id: "boot_left",
      label: "đôi ủng bên trái",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🥾",
      },
      category: {
        type: "ở bên trái",
      },
      contrast_group: "left",
    },
    {
      id: "bike_left",
      label: "xe đạp bên trái",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "ở bên trái",
      },
      contrast_group: "left",
    },
    {
      id: "arrow_left",
      label: "mũi tên bên trái",
      value: 8,
      image: {
        kind: "emoji",
        ref: "⬅️",
      },
      category: {
        type: "ở bên trái",
      },
      contrast_group: "left",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "arrow_right",
      target_id: "arrow_left",
      metadata: {
        dimension: "direction",
      },
    },
    {
      type: "contrast",
      source_id: "bus_right",
      target_id: "bike_left",
      metadata: {
        dimension: "direction",
      },
    },
    {
      type: "pair",
      source_id: "glove_right",
      target_id: "shoe_right",
      metadata: {
        relation: "cùng bên phải",
      },
    },
    {
      type: "pair",
      source_id: "sock_left",
      target_id: "boot_left",
      metadata: {
        relation: "cùng bên trái",
      },
    },
  ],
  axes: {
    direction: {
      values: ["ở bên phải", "ở bên trái"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Phải",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phải",
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
    narration_template: "Chúng mình cùng tìm hiểu về Phải nhé",
  },
  ordering: [
    "glove_right",
    "shoe_right",
    "bus_right",
    "arrow_right",
    "sock_left",
    "boot_left",
    "bike_left",
    "arrow_left",
  ],
};

export const C2_ORI_02_SEED: SkillSeed = {
  identity: C2_ORI_02_IDENTITY,
  dataset: C2_ORI_02_DATASET,
  levels: [
    {
      code: "GL-C2-ORI-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
  ],
};
