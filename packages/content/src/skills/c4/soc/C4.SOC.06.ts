import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SOC_06_IDENTITY: SkillIdentity = {
  code: "C4.SOC.06",
  strand_code: "C4.SOC",
  competency_code: "C4",
  name: "Ai giúp ta trong cộng đồng",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["infer", "describe"],
  tier: "core",
  prerequisites: ["C4.SOC.04"],
  learning_objectives: [
    {
      code: "LO-C4.SOC.06-01",
      behaviour:
        "Nhận biết và thực hành Ai giúp ta trong cộng đồng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SOC.06-02",
      behaviour:
        "Vận dụng Ai giúp ta trong cộng đồng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SOC.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Ai giúp ta trong cộng đồng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SOC_06_DATASET: SkillDataset = {
  skill_code: "C4.SOC.06",
  concept_label: "Ai giúp ta trong cộng đồng",
  surface: "game",
  items: [
    {
      id: "traffic_police",
      label: "chú cảnh sát",
      image: {
        kind: "emoji",
        ref: "👮",
      },
      category: {
        type: "người giúp đỡ",
      },
      value: 1,
      ordering: 1,
      contrast_group: "helper",
      audio_path: "/audio/vi/c4/traffic_police.mp3",
    },
    {
      id: "firefighter",
      label: "chú cứu hỏa",
      image: {
        kind: "emoji",
        ref: "👨‍🚒",
      },
      category: {
        type: "người giúp đỡ",
      },
      value: 2,
      ordering: 2,
      contrast_group: "helper",
      audio_path: "/audio/vi/c4/firefighter.mp3",
    },
    {
      id: "doctor",
      label: "cô bác sĩ",
      image: {
        kind: "emoji",
        ref: "👩‍⚕️",
      },
      category: {
        type: "người giúp đỡ",
      },
      value: 3,
      ordering: 3,
      contrast_group: "helper",
      audio_path: "/audio/vi/c4/doctor.mp3",
    },
    {
      id: "teacher",
      label: "cô giáo hiền",
      image: {
        kind: "emoji",
        ref: "👩‍🏫",
      },
      category: {
        type: "người giúp đỡ",
      },
      value: 4,
      ordering: 4,
      contrast_group: "helper",
      audio_path: "/audio/vi/c4/teacher.mp3",
    },
    {
      id: "police_car",
      label: "xe cảnh sát",
      image: {
        kind: "emoji",
        ref: "🚓",
      },
      category: {
        type: "xe và trạm",
      },
      value: 1,
      ordering: 5,
      contrast_group: "facility",
      audio_path: "/audio/vi/c4/police_car.mp3",
    },
    {
      id: "fire_truck",
      label: "xe cứu hỏa",
      image: {
        kind: "emoji",
        ref: "🚒",
      },
      category: {
        type: "xe và trạm",
      },
      value: 2,
      ordering: 6,
      contrast_group: "facility",
      audio_path: "/audio/vi/c4/fire_truck.mp3",
    },
    {
      id: "ambulance",
      label: "xe cứu thương",
      image: {
        kind: "emoji",
        ref: "🚑",
      },
      category: {
        type: "xe và trạm",
      },
      value: 3,
      ordering: 7,
      contrast_group: "facility",
      audio_path: "/audio/vi/c4/ambulance.mp3",
    },
    {
      id: "school",
      label: "trường mầm non",
      image: {
        kind: "emoji",
        ref: "🏫",
      },
      category: {
        type: "xe và trạm",
      },
      value: 4,
      ordering: 8,
      contrast_group: "facility",
      audio_path: "/audio/vi/c4/school.mp3",
    },
  ],
  axes: {
    category: {
      values: ["người giúp đỡ", "xe và trạm"],
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "traffic_police",
      target_id: "police_car",
    },
    {
      type: "pair",
      source_id: "firefighter",
      target_id: "fire_truck",
    },
    {
      type: "pair",
      source_id: "doctor",
      target_id: "ambulance",
    },
    {
      type: "pair",
      source_id: "teacher",
      target_id: "school",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ai giúp ta trong cộng đồng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ai giúp ta trong cộng đồng",
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
      "Chúng mình cùng tìm hiểu về Ai giúp ta trong cộng đồng nhé",
  },
  ordering: [
    "traffic_police",
    "firefighter",
    "doctor",
    "teacher",
    "police_car",
    "fire_truck",
    "ambulance",
    "school",
  ],
};

export const C4_SOC_06_SEED: SkillSeed = {
  identity: C4_SOC_06_IDENTITY,
  dataset: C4_SOC_06_DATASET,
  levels: [
    {
      code: "GL-C4-SOC-PAIR-0007",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-PAIR-0008",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
  ],
};
