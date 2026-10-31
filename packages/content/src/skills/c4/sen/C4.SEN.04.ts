import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SEN_04_IDENTITY: SkillIdentity = {
  code: "C4.SEN.04",
  strand_code: "C4.SEN",
  competency_code: "C4",
  name: "Phân biệt cao độ / âm sắc",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["compare", "listen"],
  tier: "advanced",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.SEN.04-01",
      behaviour:
        "Nhận biết và thực hành Phân biệt cao độ / âm sắc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SEN.04-02",
      behaviour:
        "Vận dụng Phân biệt cao độ / âm sắc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SEN.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân biệt cao độ / âm sắc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SEN_04_DATASET: SkillDataset = {
  skill_code: "C4.SEN.04",
  concept_label: "Phân biệt cao độ / âm sắc",
  surface: "game",
  items: [
    {
      id: "bird_song",
      label: "tiếng chim hót",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "âm thanh cao",
      },
      value: 1,
      ordering: 1,
      contrast_group: "high",
      audio_path: "/audio/vi/c4/bird_song.mp3",
    },
    {
      id: "wind_bell",
      label: "tiếng chuông gió",
      image: {
        kind: "emoji",
        ref: "🔔",
      },
      category: {
        type: "âm thanh cao",
      },
      value: 2,
      ordering: 2,
      contrast_group: "high",
      audio_path: "/audio/vi/c4/wind_bell.mp3",
    },
    {
      id: "flute",
      label: "tiếng sáo ngân",
      image: {
        kind: "emoji",
        ref: "🪈",
      },
      category: {
        type: "âm thanh cao",
      },
      value: 3,
      ordering: 3,
      contrast_group: "high",
      audio_path: "/audio/vi/c4/flute.mp3",
    },
    {
      id: "violin",
      label: "tiếng đàn vĩ",
      image: {
        kind: "emoji",
        ref: "🎻",
      },
      category: {
        type: "âm thanh cao",
      },
      value: 4,
      ordering: 4,
      contrast_group: "high",
      audio_path: "/audio/vi/c4/violin.mp3",
    },
    {
      id: "bass_drum",
      label: "tiếng trống trầm",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "âm thanh trầm",
      },
      value: 1,
      ordering: 5,
      contrast_group: "low",
      audio_path: "/audio/vi/c4/bass_drum.mp3",
    },
    {
      id: "train_horn",
      label: "tiếng còi tàu",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "âm thanh trầm",
      },
      value: 2,
      ordering: 6,
      contrast_group: "low",
      audio_path: "/audio/vi/c4/train_horn.mp3",
    },
    {
      id: "tuba",
      label: "tiếng kèn đồng",
      image: {
        kind: "emoji",
        ref: "🎺",
      },
      category: {
        type: "âm thanh trầm",
      },
      value: 3,
      ordering: 7,
      contrast_group: "low",
      audio_path: "/audio/vi/c4/tuba.mp3",
    },
    {
      id: "thunder",
      label: "tiếng sấm rền",
      image: {
        kind: "emoji",
        ref: "⛈️",
      },
      category: {
        type: "âm thanh trầm",
      },
      value: 4,
      ordering: 8,
      contrast_group: "low",
      audio_path: "/audio/vi/c4/thunder.mp3",
    },
  ],
  axes: {
    category: {
      values: ["âm thanh cao", "âm thanh trầm"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "bird_song",
      target_id: "bass_drum",
    },
    {
      type: "contrast",
      source_id: "wind_bell",
      target_id: "train_horn",
    },
    {
      type: "contrast",
      source_id: "flute",
      target_id: "tuba",
    },
    {
      type: "contrast",
      source_id: "violin",
      target_id: "thunder",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Phân biệt cao độ / âm sắc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân biệt cao độ / âm sắc",
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
      "Chúng mình cùng tìm hiểu về Phân biệt cao độ / âm sắc nhé",
  },
  ordering: [
    "bird_song",
    "wind_bell",
    "flute",
    "violin",
    "bass_drum",
    "train_horn",
    "tuba",
    "thunder",
  ],
};

export const C4_SEN_04_SEED: SkillSeed = {
  identity: C4_SEN_04_IDENTITY,
  dataset: C4_SEN_04_DATASET,
  levels: [
    {
      code: "GL-C4-SEN-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCNT-0006",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
