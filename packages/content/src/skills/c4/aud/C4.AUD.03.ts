import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_AUD_03_IDENTITY: SkillIdentity = {
  code: "C4.AUD.03",
  strand_code: "C4.AUD",
  competency_code: "C4",
  name: "Nhanh – chậm",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["listen", "compare"],
  tier: "basic",
  prerequisites: ["C4.AUD.01"],
  learning_objectives: [
    {
      code: "LO-C4.AUD.03-01",
      behaviour: "Nhận biết và thực hành Nhanh – chậm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.AUD.03-02",
      behaviour: "Vận dụng Nhanh – chậm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.AUD.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhanh – chậm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_AUD_03_DATASET: SkillDataset = {
  skill_code: "C4.AUD.03",
  concept_label: "Nhanh – chậm",
  surface: "game",
  items: [
    {
      id: "aud_horse_gallop",
      label: "tiếng ngựa phi",
      image: {
        kind: "emoji",
        ref: "🐎",
      },
      category: {
        type: "nhịp nhanh",
      },
      contrast_group: "fast",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/aud_horse_gallop.mp3",
    },
    {
      id: "aud_clap_fast",
      label: "tiếng vỗ tay nhanh",
      image: {
        kind: "emoji",
        ref: "👏",
      },
      category: {
        type: "nhịp nhanh",
      },
      contrast_group: "fast",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/aud_clap_fast.mp3",
    },
    {
      id: "aud_train_fast",
      label: "tiếng tàu nhanh",
      image: {
        kind: "emoji",
        ref: "🚅",
      },
      category: {
        type: "nhịp nhanh",
      },
      contrast_group: "fast",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/aud_train_fast.mp3",
    },
    {
      id: "aud_drum_roll",
      label: "tiếng trống nhanh",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "nhịp nhanh",
      },
      contrast_group: "fast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/aud_drum_roll.mp3",
    },
    {
      id: "aud_clock_slow",
      label: "tiếng đồng hồ chậm",
      image: {
        kind: "emoji",
        ref: "🕰️",
      },
      category: {
        type: "nhịp chậm",
      },
      contrast_group: "slow",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/aud_clock_slow.mp3",
    },
    {
      id: "aud_step_slow",
      label: "tiếng chân chậm",
      image: {
        kind: "emoji",
        ref: "👣",
      },
      category: {
        type: "nhịp chậm",
      },
      contrast_group: "slow",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/aud_step_slow.mp3",
    },
    {
      id: "aud_drip_slow",
      label: "tiếng nước chậm",
      image: {
        kind: "emoji",
        ref: "💧",
      },
      category: {
        type: "nhịp chậm",
      },
      contrast_group: "slow",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/aud_drip_slow.mp3",
    },
    {
      id: "aud_bell_slow",
      label: "tiếng chuông chậm",
      image: {
        kind: "emoji",
        ref: "🔔",
      },
      category: {
        type: "nhịp chậm",
      },
      contrast_group: "slow",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/aud_bell_slow.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "aud_horse_gallop",
      target_id: "aud_clock_slow",
    },
    {
      type: "contrast",
      source_id: "aud_clap_fast",
      target_id: "aud_step_slow",
    },
    {
      type: "contrast",
      source_id: "aud_train_fast",
      target_id: "aud_drip_slow",
    },
    {
      type: "contrast",
      source_id: "aud_drum_roll",
      target_id: "aud_bell_slow",
    },
  ],
  axes: {
    tempo: {
      values: ["nhịp chậm", "nhịp nhanh"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhanh – chậm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhanh – chậm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhanh – chậm nhé",
  },
  ordering: [
    "aud_horse_gallop",
    "aud_clap_fast",
    "aud_train_fast",
    "aud_drum_roll",
    "aud_clock_slow",
    "aud_step_slow",
    "aud_drip_slow",
    "aud_bell_slow",
  ],
};

export const C4_AUD_03_SEED: SkillSeed = {
  identity: C4_AUD_03_IDENTITY,
  dataset: C4_AUD_03_DATASET,
  levels: [
    {
      code: "GL-C4-AUD-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
  ],
};
