import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_AUD_05_IDENTITY: SkillIdentity = {
  code: "C4.AUD.05",
  strand_code: "C4.AUD",
  competency_code: "C4",
  name: "Cao – thấp",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "compare"],
  tier: "core",
  prerequisites: ["C4.AUD.01"],
  learning_objectives: [
    {
      code: "LO-C4.AUD.05-01",
      behaviour: "Nhận biết và thực hành Cao – thấp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.AUD.05-02",
      behaviour: "Vận dụng Cao – thấp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.AUD.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cao – thấp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_AUD_05_DATASET: SkillDataset = {
  skill_code: "C4.AUD.05",
  concept_label: "Cao – thấp",
  surface: "game",
  items: [
    {
      id: "aud_bird_high",
      label: "tiếng chim hót",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "âm cao vút",
      },
      contrast_group: "high_pitch",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/aud_bird_high.mp3",
    },
    {
      id: "aud_bell_high",
      label: "tiếng chuông cao",
      image: {
        kind: "emoji",
        ref: "🔔",
      },
      category: {
        type: "âm cao vút",
      },
      contrast_group: "high_pitch",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/aud_bell_high.mp3",
    },
    {
      id: "aud_flute_high",
      label: "tiếng sáo cao",
      image: {
        kind: "emoji",
        ref: "🪈",
      },
      category: {
        type: "âm cao vút",
      },
      contrast_group: "high_pitch",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/aud_flute_high.mp3",
    },
    {
      id: "aud_whistle",
      label: "tiếng còi cao",
      image: {
        kind: "emoji",
        ref: "📣",
      },
      category: {
        type: "âm cao vút",
      },
      contrast_group: "high_pitch",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/aud_whistle.mp3",
    },
    {
      id: "aud_drum_bass",
      label: "tiếng trống trầm",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "âm trầm thấp",
      },
      contrast_group: "low_pitch",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/aud_drum_bass.mp3",
    },
    {
      id: "aud_frog_bass",
      label: "tiếng ếch trầm",
      image: {
        kind: "emoji",
        ref: "🐸",
      },
      category: {
        type: "âm trầm thấp",
      },
      contrast_group: "low_pitch",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/aud_frog_bass.mp3",
    },
    {
      id: "aud_cow_bass",
      label: "tiếng bò trầm",
      image: {
        kind: "emoji",
        ref: "🐂",
      },
      category: {
        type: "âm trầm thấp",
      },
      contrast_group: "low_pitch",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/aud_cow_bass.mp3",
    },
    {
      id: "aud_ship_bass",
      label: "tiếng còi tàu",
      image: {
        kind: "emoji",
        ref: "🚢",
      },
      category: {
        type: "âm trầm thấp",
      },
      contrast_group: "low_pitch",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/aud_ship_bass.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "aud_bird_high",
      target_id: "aud_cow_bass",
    },
    {
      type: "contrast",
      source_id: "aud_bell_high",
      target_id: "aud_drum_bass",
    },
    {
      type: "contrast",
      source_id: "aud_flute_high",
      target_id: "aud_ship_bass",
    },
    {
      type: "contrast",
      source_id: "aud_whistle",
      target_id: "aud_frog_bass",
    },
  ],
  axes: {
    pitch: {
      values: ["âm trầm thấp", "âm cao vút"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Cao – thấp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Cao – thấp",
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
    narration_template: "Chúng mình cùng tìm hiểu về Cao – thấp nhé",
  },
  ordering: [
    "aud_bird_high",
    "aud_bell_high",
    "aud_flute_high",
    "aud_whistle",
    "aud_drum_bass",
    "aud_frog_bass",
    "aud_cow_bass",
    "aud_ship_bass",
  ],
};

export const C4_AUD_05_SEED: SkillSeed = {
  identity: C4_AUD_05_IDENTITY,
  dataset: C4_AUD_05_DATASET,
  levels: [
    {
      code: "GL-C4-AUD-TAP-0010",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TAP-0011",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
