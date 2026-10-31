import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_AUD_01_IDENTITY: SkillIdentity = {
  code: "C4.AUD.01",
  strand_code: "C4.AUD",
  competency_code: "C4",
  name: "To – nhỏ",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["listen", "compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.AUD.01-01",
      behaviour: "Nhận biết và thực hành To – nhỏ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.AUD.01-02",
      behaviour: "Vận dụng To – nhỏ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.AUD.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới To – nhỏ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_AUD_01_DATASET: SkillDataset = {
  skill_code: "C4.AUD.01",
  concept_label: "To – nhỏ",
  surface: "game",
  items: [
    {
      id: "aud_thunder",
      label: "tiếng sấm sét",
      image: {
        kind: "emoji",
        ref: "⛈️",
      },
      category: {
        type: "âm thanh to",
      },
      contrast_group: "loud",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/aud_thunder.mp3",
    },
    {
      id: "aud_drum_loud",
      label: "tiếng trống vang",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "âm thanh to",
      },
      contrast_group: "loud",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/aud_drum_loud.mp3",
    },
    {
      id: "aud_plane_loud",
      label: "tiếng máy bay",
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "âm thanh to",
      },
      contrast_group: "loud",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/aud_plane_loud.mp3",
    },
    {
      id: "aud_lion_roar",
      label: "tiếng sư tử gầm",
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "âm thanh to",
      },
      contrast_group: "loud",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/aud_lion_roar.mp3",
    },
    {
      id: "aud_whisper",
      label: "tiếng thì thầm",
      image: {
        kind: "emoji",
        ref: "🤫",
      },
      category: {
        type: "âm thanh nhỏ",
      },
      contrast_group: "quiet",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/aud_whisper.mp3",
    },
    {
      id: "aud_clock_tick",
      label: "tiếng đồng hồ",
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      category: {
        type: "âm thanh nhỏ",
      },
      contrast_group: "quiet",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/aud_clock_tick.mp3",
    },
    {
      id: "aud_drizzle",
      label: "tiếng mưa phùn",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "âm thanh nhỏ",
      },
      contrast_group: "quiet",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/aud_drizzle.mp3",
    },
    {
      id: "aud_cat_purr",
      label: "tiếng mèo kêu",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "âm thanh nhỏ",
      },
      contrast_group: "quiet",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/aud_cat_purr.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "aud_thunder",
      target_id: "aud_whisper",
    },
    {
      type: "contrast",
      source_id: "aud_drum_loud",
      target_id: "aud_clock_tick",
    },
    {
      type: "contrast",
      source_id: "aud_plane_loud",
      target_id: "aud_drizzle",
    },
    {
      type: "contrast",
      source_id: "aud_lion_roar",
      target_id: "aud_cat_purr",
    },
  ],
  axes: {
    volume: {
      values: ["âm thanh nhỏ", "âm thanh to"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với To – nhỏ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng To – nhỏ",
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
    narration_template: "Chúng mình cùng tìm hiểu về To – nhỏ nhé",
  },
  ordering: [
    "aud_thunder",
    "aud_drum_loud",
    "aud_plane_loud",
    "aud_lion_roar",
    "aud_whisper",
    "aud_clock_tick",
    "aud_drizzle",
    "aud_cat_purr",
  ],
};

export const C4_AUD_01_SEED: SkillSeed = {
  identity: C4_AUD_01_IDENTITY,
  dataset: C4_AUD_01_DATASET,
  levels: [
    {
      code: "GL-C4-AUD-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
  ],
};
