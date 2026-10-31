import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_AUD_04_IDENTITY: SkillIdentity = {
  code: "C4.AUD.04",
  strand_code: "C4.AUD",
  competency_code: "C4",
  name: "Tiếng đồ vật quen thuộc",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["listen", "match"],
  tier: "basic",
  prerequisites: ["C4.AUD.02"],
  learning_objectives: [
    {
      code: "LO-C4.AUD.04-01",
      behaviour: "Nhận biết và thực hành Tiếng đồ vật quen thuộc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.AUD.04-02",
      behaviour: "Vận dụng Tiếng đồ vật quen thuộc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.AUD.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tiếng đồ vật quen thuộc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_AUD_04_DATASET: SkillDataset = {
  skill_code: "C4.AUD.04",
  concept_label: "Tiếng đồ vật quen thuộc",
  surface: "game",
  items: [
    {
      id: "aud_doorbell",
      label: "tiếng chuông cửa",
      image: {
        kind: "emoji",
        ref: "🔔",
      },
      category: {
        type: "tiếng đồ dùng",
      },
      contrast_group: "appliance",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/aud_doorbell.mp3",
    },
    {
      id: "aud_alarm",
      label: "tiếng chuông reo",
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      category: {
        type: "tiếng đồ dùng",
      },
      contrast_group: "appliance",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/aud_alarm.mp3",
    },
    {
      id: "aud_phone",
      label: "tiếng điện thoại",
      image: {
        kind: "emoji",
        ref: "☎️",
      },
      category: {
        type: "tiếng đồ dùng",
      },
      contrast_group: "appliance",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/aud_phone.mp3",
    },
    {
      id: "aud_kettle",
      label: "tiếng ấm reo",
      image: {
        kind: "emoji",
        ref: "🫖",
      },
      category: {
        type: "tiếng đồ dùng",
      },
      contrast_group: "appliance",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/aud_kettle.mp3",
    },
    {
      id: "aud_toy_drum",
      label: "tiếng trống đồ chơi",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "tiếng đồ chơi",
      },
      contrast_group: "toy",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/aud_toy_drum.mp3",
    },
    {
      id: "aud_rattle",
      label: "tiếng lục lạc",
      image: {
        kind: "emoji",
        ref: "🪇",
      },
      category: {
        type: "tiếng đồ chơi",
      },
      contrast_group: "toy",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/aud_rattle.mp3",
    },
    {
      id: "aud_toy_train",
      label: "tiếng tàu đồ chơi",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "tiếng đồ chơi",
      },
      contrast_group: "toy",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/aud_toy_train.mp3",
    },
    {
      id: "aud_toy_whistle",
      label: "tiếng còi đồ chơi",
      image: {
        kind: "emoji",
        ref: "🪈",
      },
      category: {
        type: "tiếng đồ chơi",
      },
      contrast_group: "toy",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/aud_toy_whistle.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "aud_doorbell",
      target_id: "aud_toy_drum",
    },
    {
      type: "contrast",
      source_id: "aud_alarm",
      target_id: "aud_rattle",
    },
    {
      type: "contrast",
      source_id: "aud_phone",
      target_id: "aud_toy_train",
    },
    {
      type: "contrast",
      source_id: "aud_kettle",
      target_id: "aud_toy_whistle",
    },
  ],
  axes: {
    item_type: {
      values: ["tiếng đồ dùng", "tiếng đồ chơi"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tiếng đồ vật quen thuộc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tiếng đồ vật quen thuộc",
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
      "Chúng mình cùng tìm hiểu về Tiếng đồ vật quen thuộc nhé",
  },
  ordering: [
    "aud_doorbell",
    "aud_alarm",
    "aud_phone",
    "aud_kettle",
    "aud_toy_drum",
    "aud_rattle",
    "aud_toy_train",
    "aud_toy_whistle",
  ],
};

export const C4_AUD_04_SEED: SkillSeed = {
  identity: C4_AUD_04_IDENTITY,
  dataset: C4_AUD_04_DATASET,
  levels: [
    {
      code: "GL-C4-AUD-TAP-0008",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TAP-0009",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
