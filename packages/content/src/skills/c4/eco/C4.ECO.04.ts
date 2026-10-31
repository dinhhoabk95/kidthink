import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_ECO_04_IDENTITY: SkillIdentity = {
  code: "C4.ECO.04",
  strand_code: "C4.ECO",
  competency_code: "C4",
  name: "Tiết kiệm nước và điện",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["plan", "inhibit"],
  tier: "core",
  prerequisites: ["C4.ECO.02"],
  learning_objectives: [
    {
      code: "LO-C4.ECO.04-01",
      behaviour: "Nhận biết và thực hành Tiết kiệm nước và điện ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.ECO.04-02",
      behaviour: "Vận dụng Tiết kiệm nước và điện trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.ECO.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tiết kiệm nước và điện",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_ECO_04_DATASET: SkillDataset = {
  skill_code: "C4.ECO.04",
  concept_label: "Tiết kiệm nước và điện",
  surface: "game",
  items: [
    {
      id: "eco_tap_off",
      label: "khóa vòi nước",
      image: {
        kind: "emoji",
        ref: "🚰",
      },
      category: {
        type: "hành động đúng",
      },
      contrast_group: "save",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/eco_tap_off.mp3",
    },
    {
      id: "eco_light_off",
      label: "tắt bóng đèn",
      image: {
        kind: "emoji",
        ref: "💡",
      },
      category: {
        type: "hành động đúng",
      },
      contrast_group: "save",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/eco_light_off.mp3",
    },
    {
      id: "eco_fan_off",
      label: "tắt quạt điện",
      image: {
        kind: "emoji",
        ref: "🪭",
      },
      category: {
        type: "hành động đúng",
      },
      contrast_group: "save",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/eco_fan_off.mp3",
    },
    {
      id: "eco_tv_off",
      label: "tắt ti-vi",
      image: {
        kind: "emoji",
        ref: "📺",
      },
      category: {
        type: "hành động đúng",
      },
      contrast_group: "save",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/eco_tv_off.mp3",
    },
    {
      id: "eco_tap_run",
      label: "vòi nước tràn",
      image: {
        kind: "emoji",
        ref: "🚿",
      },
      category: {
        type: "hành động sai",
      },
      contrast_group: "waste",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/eco_tap_run.mp3",
    },
    {
      id: "eco_light_on",
      label: "đèn bật mãi",
      image: {
        kind: "emoji",
        ref: "🔦",
      },
      category: {
        type: "hành động sai",
      },
      contrast_group: "waste",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/eco_light_on.mp3",
    },
    {
      id: "eco_fridge_open",
      label: "cửa mở toang",
      image: {
        kind: "emoji",
        ref: "🚪",
      },
      category: {
        type: "hành động sai",
      },
      contrast_group: "waste",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/eco_fridge_open.mp3",
    },
    {
      id: "eco_ac_open",
      label: "gió điều hòa",
      image: {
        kind: "emoji",
        ref: "💨",
      },
      category: {
        type: "hành động sai",
      },
      contrast_group: "waste",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/eco_ac_open.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "eco_tap_off",
      target_id: "eco_tap_run",
    },
    {
      type: "contrast",
      source_id: "eco_light_off",
      target_id: "eco_light_on",
    },
    {
      type: "contrast",
      source_id: "eco_fan_off",
      target_id: "eco_fridge_open",
    },
    {
      type: "contrast",
      source_id: "eco_tv_off",
      target_id: "eco_ac_open",
    },
  ],
  axes: {
    eco_action: {
      values: ["hành động đúng", "hành động sai"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tiết kiệm nước và điện",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tiết kiệm nước và điện",
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
      "Chúng mình cùng tìm hiểu về Tiết kiệm nước và điện nhé",
  },
  ordering: [
    "eco_tap_off",
    "eco_light_off",
    "eco_fan_off",
    "eco_tv_off",
    "eco_tap_run",
    "eco_light_on",
    "eco_fridge_open",
    "eco_ac_open",
  ],
};

export const C4_ECO_04_SEED: SkillSeed = {
  identity: C4_ECO_04_IDENTITY,
  dataset: C4_ECO_04_DATASET,
  levels: [
    {
      code: "GL-C4-ECO-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      template: "GT-026",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
    },
  ],
};
