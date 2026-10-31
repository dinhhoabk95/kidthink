import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_AUD_06_IDENTITY: SkillIdentity = {
  code: "C4.AUD.06",
  strand_code: "C4.AUD",
  competency_code: "C4",
  name: "Âm sắc nhạc cụ",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "compare"],
  tier: "advanced",
  prerequisites: ["C4.AUD.05"],
  learning_objectives: [
    {
      code: "LO-C4.AUD.06-01",
      behaviour: "Nhận biết và thực hành Âm sắc nhạc cụ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.AUD.06-02",
      behaviour: "Vận dụng Âm sắc nhạc cụ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.AUD.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Âm sắc nhạc cụ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_AUD_06_DATASET: SkillDataset = {
  skill_code: "C4.AUD.06",
  concept_label: "Âm sắc nhạc cụ",
  surface: "game",
  items: [
    {
      id: "aud_inst_drum",
      label: "tiếng trống vang",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "nhạc cụ gõ",
      },
      contrast_group: "percussion",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/aud_inst_drum.mp3",
    },
    {
      id: "aud_inst_bell",
      label: "tiếng chuông gõ",
      image: {
        kind: "emoji",
        ref: "🔔",
      },
      category: {
        type: "nhạc cụ gõ",
      },
      contrast_group: "percussion",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/aud_inst_bell.mp3",
    },
    {
      id: "aud_inst_maraca",
      label: "tiếng lục lạc",
      image: {
        kind: "emoji",
        ref: "🪇",
      },
      category: {
        type: "nhạc cụ gõ",
      },
      contrast_group: "percussion",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/aud_inst_maraca.mp3",
    },
    {
      id: "aud_inst_woodblock",
      label: "tiếng mõ gỗ",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "nhạc cụ gõ",
      },
      contrast_group: "percussion",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/aud_inst_woodblock.mp3",
    },
    {
      id: "aud_inst_guitar",
      label: "tiếng đàn ghi-ta",
      image: {
        kind: "emoji",
        ref: "🎸",
      },
      category: {
        type: "nhạc cụ dây",
      },
      contrast_group: "string",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/aud_inst_guitar.mp3",
    },
    {
      id: "aud_inst_violin",
      label: "tiếng đàn vĩ cầm",
      image: {
        kind: "emoji",
        ref: "🎻",
      },
      category: {
        type: "nhạc cụ dây",
      },
      contrast_group: "string",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/aud_inst_violin.mp3",
    },
    {
      id: "aud_inst_piano",
      label: "tiếng đàn pi-a-nô",
      image: {
        kind: "emoji",
        ref: "🎹",
      },
      category: {
        type: "nhạc cụ dây",
      },
      contrast_group: "string",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/aud_inst_piano.mp3",
    },
    {
      id: "aud_inst_harp",
      label: "tiếng đàn hạc",
      image: {
        kind: "emoji",
        ref: "🪕",
      },
      category: {
        type: "nhạc cụ dây",
      },
      contrast_group: "string",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/aud_inst_harp.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "aud_inst_drum",
      target_id: "aud_inst_guitar",
    },
    {
      type: "contrast",
      source_id: "aud_inst_bell",
      target_id: "aud_inst_violin",
    },
    {
      type: "contrast",
      source_id: "aud_inst_maraca",
      target_id: "aud_inst_piano",
    },
    {
      type: "contrast",
      source_id: "aud_inst_woodblock",
      target_id: "aud_inst_harp",
    },
  ],
  axes: {
    instrument_type: {
      values: ["nhạc cụ gõ", "nhạc cụ dây"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Âm sắc nhạc cụ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Âm sắc nhạc cụ",
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
    narration_template: "Chúng mình cùng tìm hiểu về Âm sắc nhạc cụ nhé",
  },
  ordering: [
    "aud_inst_drum",
    "aud_inst_bell",
    "aud_inst_maraca",
    "aud_inst_woodblock",
    "aud_inst_guitar",
    "aud_inst_violin",
    "aud_inst_piano",
    "aud_inst_harp",
  ],
};

export const C4_AUD_06_SEED: SkillSeed = {
  identity: C4_AUD_06_IDENTITY,
  dataset: C4_AUD_06_DATASET,
  levels: [
    {
      code: "GL-C4-AUD-TAP-0012",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TAP-0013",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PATT-0012",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
  ],
};
