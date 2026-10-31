import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SAF_04_IDENTITY: SkillIdentity = {
  code: "C4.SAF.04",
  strand_code: "C4.SAF",
  competency_code: "C4",
  name: "Biển báo quen thuộc",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["match", "infer"],
  tier: "core",
  prerequisites: ["C4.SAF.02"],
  learning_objectives: [
    {
      code: "LO-C4.SAF.04-01",
      behaviour: "Nhận biết và thực hành Biển báo quen thuộc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SAF.04-02",
      behaviour: "Vận dụng Biển báo quen thuộc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SAF.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Biển báo quen thuộc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SAF_04_DATASET: SkillDataset = {
  skill_code: "C4.SAF.04",
  concept_label: "Biển báo quen thuộc",
  surface: "game",
  items: [
    {
      id: "pedestrian_sign",
      label: "biển lối đi",
      image: {
        kind: "emoji",
        ref: "🚸",
      },
      category: {
        type: "biển chỉ dẫn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "guide",
      audio_path: "/audio/vi/c4/pedestrian_sign.mp3",
    },
    {
      id: "hospital_sign",
      label: "biển bệnh viện",
      image: {
        kind: "emoji",
        ref: "🏥",
      },
      category: {
        type: "biển chỉ dẫn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "guide",
      audio_path: "/audio/vi/c4/hospital_sign.mp3",
    },
    {
      id: "bus_stop_sign",
      label: "biển bến xe",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "biển chỉ dẫn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "guide",
      audio_path: "/audio/vi/c4/bus_stop_sign.mp3",
    },
    {
      id: "traffic_light_sign",
      label: "biển cột đèn",
      image: {
        kind: "emoji",
        ref: "🚦",
      },
      category: {
        type: "biển chỉ dẫn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "guide",
      audio_path: "/audio/vi/c4/traffic_light_sign.mp3",
    },
    {
      id: "stop_sign",
      label: "biển dừng lại",
      image: {
        kind: "emoji",
        ref: "🛑",
      },
      category: {
        type: "biển cảnh báo",
      },
      value: 1,
      ordering: 5,
      contrast_group: "warning",
      audio_path: "/audio/vi/c4/stop_sign.mp3",
    },
    {
      id: "no_entry_sign",
      label: "biển đường cấm",
      image: {
        kind: "emoji",
        ref: "⛔",
      },
      category: {
        type: "biển cảnh báo",
      },
      value: 2,
      ordering: 6,
      contrast_group: "warning",
      audio_path: "/audio/vi/c4/no_entry_sign.mp3",
    },
    {
      id: "warning_fire_sign",
      label: "biển có lửa",
      image: {
        kind: "emoji",
        ref: "🔥",
      },
      category: {
        type: "biển cảnh báo",
      },
      value: 3,
      ordering: 7,
      contrast_group: "warning",
      audio_path: "/audio/vi/c4/warning_fire_sign.mp3",
    },
    {
      id: "work_sign",
      label: "biển rào chắn",
      image: {
        kind: "emoji",
        ref: "🚧",
      },
      category: {
        type: "biển cảnh báo",
      },
      value: 4,
      ordering: 8,
      contrast_group: "warning",
      audio_path: "/audio/vi/c4/work_sign.mp3",
    },
  ],
  axes: {
    category: {
      values: ["biển chỉ dẫn", "biển cảnh báo"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pedestrian_sign",
      target_id: "stop_sign",
    },
    {
      type: "contrast",
      source_id: "hospital_sign",
      target_id: "no_entry_sign",
    },
    {
      type: "contrast",
      source_id: "bus_stop_sign",
      target_id: "warning_fire_sign",
    },
    {
      type: "contrast",
      source_id: "traffic_light_sign",
      target_id: "work_sign",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Biển báo quen thuộc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Biển báo quen thuộc",
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
    narration_template: "Chúng mình cùng tìm hiểu về Biển báo quen thuộc nhé",
  },
  ordering: [
    "pedestrian_sign",
    "hospital_sign",
    "bus_stop_sign",
    "traffic_light_sign",
    "stop_sign",
    "no_entry_sign",
    "warning_fire_sign",
    "work_sign",
  ],
};

export const C4_SAF_04_SEED: SkillSeed = {
  identity: C4_SAF_04_IDENTITY,
  dataset: C4_SAF_04_DATASET,
  levels: [
    {
      code: "GL-C4-SAF-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TRACE-0001",
      template: "GT-024",
      band: "5-6",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TRACE-0002",
      template: "GT-024",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
