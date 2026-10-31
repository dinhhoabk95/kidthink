import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SAF_06_IDENTITY: SkillIdentity = {
  code: "C4.SAF.06",
  strand_code: "C4.SAF",
  competency_code: "C4",
  name: "Ai được phép chạm vào con",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["deduce", "describe"],
  tier: "advanced",
  prerequisites: ["C4.SOC.02"],
  learning_objectives: [
    {
      code: "LO-C4.SAF.06-01",
      behaviour:
        "Nhận biết và thực hành Ai được phép chạm vào con ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SAF.06-02",
      behaviour:
        "Vận dụng Ai được phép chạm vào con trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SAF.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Ai được phép chạm vào con",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SAF_06_DATASET: SkillDataset = {
  skill_code: "C4.SAF.06",
  concept_label: "Ai được phép chạm vào con",
  surface: "game",
  items: [
    {
      id: "mother",
      label: "mẹ yêu thương",
      image: {
        kind: "emoji",
        ref: "👩",
      },
      category: {
        type: "người thân quen",
      },
      value: 1,
      ordering: 1,
      contrast_group: "family",
      audio_path: "/audio/vi/c4/mother.mp3",
    },
    {
      id: "father",
      label: "bố chở che",
      image: {
        kind: "emoji",
        ref: "👨",
      },
      category: {
        type: "người thân quen",
      },
      value: 2,
      ordering: 2,
      contrast_group: "family",
      audio_path: "/audio/vi/c4/father.mp3",
    },
    {
      id: "grandmother",
      label: "bà dịu hiền",
      image: {
        kind: "emoji",
        ref: "👵",
      },
      category: {
        type: "người thân quen",
      },
      value: 3,
      ordering: 3,
      contrast_group: "family",
      audio_path: "/audio/vi/c4/grandmother.mp3",
    },
    {
      id: "doctor_parent",
      label: "bác sĩ quen",
      image: {
        kind: "emoji",
        ref: "👩‍⚕️",
      },
      category: {
        type: "người thân quen",
      },
      value: 4,
      ordering: 4,
      contrast_group: "family",
      audio_path: "/audio/vi/c4/doctor_parent.mp3",
    },
    {
      id: "stranger_candy",
      label: "người xa lạ",
      image: {
        kind: "emoji",
        ref: "👤",
      },
      category: {
        type: "người lạ mặt",
      },
      value: 1,
      ordering: 5,
      contrast_group: "stranger",
      audio_path: "/audio/vi/c4/stranger_candy.mp3",
    },
    {
      id: "stranger_invite",
      label: "xe người lạ",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "người lạ mặt",
      },
      value: 2,
      ordering: 6,
      contrast_group: "stranger",
      audio_path: "/audio/vi/c4/stranger_invite.mp3",
    },
    {
      id: "stranger_touch",
      label: "biển dừng lại",
      image: {
        kind: "emoji",
        ref: "🛑",
      },
      category: {
        type: "người lạ mặt",
      },
      value: 3,
      ordering: 7,
      contrast_group: "stranger",
      audio_path: "/audio/vi/c4/stranger_touch.mp3",
    },
    {
      id: "stranger_camera",
      label: "còi báo động",
      image: {
        kind: "emoji",
        ref: "🚨",
      },
      category: {
        type: "người lạ mặt",
      },
      value: 4,
      ordering: 8,
      contrast_group: "stranger",
      audio_path: "/audio/vi/c4/stranger_camera.mp3",
    },
  ],
  axes: {
    category: {
      values: ["người thân quen", "người lạ mặt"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "mother",
      target_id: "stranger_candy",
    },
    {
      type: "contrast",
      source_id: "father",
      target_id: "stranger_invite",
    },
    {
      type: "contrast",
      source_id: "grandmother",
      target_id: "stranger_touch",
    },
    {
      type: "contrast",
      source_id: "doctor_parent",
      target_id: "stranger_camera",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ai được phép chạm vào con",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ai được phép chạm vào con",
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
      "Chúng mình cùng tìm hiểu về Ai được phép chạm vào con nhé",
  },
  ordering: [
    "mother",
    "father",
    "grandmother",
    "doctor_parent",
    "stranger_candy",
    "stranger_invite",
    "stranger_touch",
    "stranger_camera",
  ],
};

export const C4_SAF_06_SEED: SkillSeed = {
  identity: C4_SAF_06_IDENTITY,
  dataset: C4_SAF_06_DATASET,
  levels: [
    {
      code: "GL-C4-SAF-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
  ],
};
