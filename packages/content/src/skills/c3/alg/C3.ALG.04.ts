import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_ALG_04_IDENTITY: SkillIdentity = {
  code: "C3.ALG.04",
  strand_code: "C3.ALG",
  competency_code: "C3",
  name: "Nhìn dấu hiệu chọn cách làm",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["deduce", "plan"],
  tier: "advanced",
  prerequisites: ["C3.ALG.02", "C3.DED.02"],
  learning_objectives: [
    {
      code: "LO-C3.ALG.04-01",
      behaviour: "Nhận biết và thực hành Nếu gặp … thì … ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.ALG.04-02",
      behaviour: "Vận dụng Nếu gặp … thì … trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.ALG.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nếu gặp … thì …",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_ALG_04_DATASET: SkillDataset = {
  skill_code: "C3.ALG.04",
  concept_label: "Nhìn dấu hiệu chọn cách làm",
  surface: "game",
  items: [
    {
      id: "rain_cloud",
      label: "trời đổ mưa",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "dấu hiệu trời",
        color: "blue",
        shape: "circle",
        size: "large",
      },
      contrast_group: "condition",
      value: 1,
      ordering: 1,
    },
    {
      id: "umbrella",
      label: "chiếc ô che",
      image: {
        kind: "emoji",
        ref: "☂️",
      },
      category: {
        type: "đồ dùng hợp",
        color: "purple",
        shape: "triangle",
        size: "medium",
      },
      contrast_group: "action",
      value: 2,
      ordering: 2,
    },
    {
      id: "bright_sun",
      label: "trời nắng to",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "dấu hiệu trời",
        color: "yellow",
        shape: "circle",
        size: "large",
      },
      contrast_group: "condition",
      value: 3,
      ordering: 3,
    },
    {
      id: "sun_hat",
      label: "chiếc mũ rộng",
      image: {
        kind: "emoji",
        ref: "👒",
      },
      category: {
        type: "đồ dùng hợp",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "action",
      value: 4,
      ordering: 4,
    },
    {
      id: "snow_wind",
      label: "trời gió lạnh",
      image: {
        kind: "emoji",
        ref: "❄️",
      },
      category: {
        type: "dấu hiệu trời",
        color: "white",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "condition",
      value: 5,
      ordering: 5,
    },
    {
      id: "warm_scarf",
      label: "khăn quàng ấm",
      image: {
        kind: "emoji",
        ref: "🧣",
      },
      category: {
        type: "đồ dùng hợp",
        color: "red",
        shape: "rectangle",
        size: "medium",
      },
      contrast_group: "action",
      value: 6,
      ordering: 6,
    },
    {
      id: "night_moon",
      label: "trời tối đêm",
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      category: {
        type: "dấu hiệu trời",
        color: "yellow",
        shape: "circle",
        size: "medium",
      },
      contrast_group: "condition",
      value: 7,
      ordering: 7,
    },
    {
      id: "table_lamp",
      label: "bóng đèn sáng",
      image: {
        kind: "emoji",
        ref: "💡",
      },
      category: {
        type: "đồ dùng hợp",
        color: "yellow",
        shape: "circle",
        size: "small",
      },
      contrast_group: "action",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "rain_cloud",
      target_id: "umbrella",
      explanation: "trời mưa thì dùng ô che",
      metadata: { reason: "cause_effect" },
    },
    {
      type: "pair",
      source_id: "bright_sun",
      target_id: "sun_hat",
      explanation: "trời nắng thì đội mũ rộng",
      metadata: { reason: "cause_effect" },
    },
    {
      type: "pair",
      source_id: "snow_wind",
      target_id: "warm_scarf",
      explanation: "trời lạnh thì quàng khăn ấm",
      metadata: { reason: "cause_effect" },
    },
    {
      type: "pair",
      source_id: "night_moon",
      target_id: "table_lamp",
      explanation: "trời tối thì bật đèn sáng",
      metadata: { reason: "cause_effect" },
    },
  ],
  axes: {
    type: ["dấu hiệu trời", "đồ dùng hợp"],
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với nhìn dấu hiệu chọn cách làm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng nhìn dấu hiệu chọn cách làm",
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
      "Chúng mình cùng nhìn dấu hiệu để chọn đồ vật phù hợp nhé",
  },
  ordering: [
    "rain_cloud",
    "umbrella",
    "bright_sun",
    "sun_hat",
    "snow_wind",
    "warm_scarf",
    "night_moon",
    "table_lamp",
  ],
};

export const C3_ALG_04_SEED: SkillSeed = {
  identity: C3_ALG_04_IDENTITY,
  dataset: C3_ALG_04_DATASET,
  levels: [
    {
      code: "GL-C3-ALG-SORT-0005",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SORT-0006",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C3-ALG-SHAD-0007",
      template: "GT-007",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
