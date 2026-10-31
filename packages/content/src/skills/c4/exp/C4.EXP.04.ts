import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_EXP_04_IDENTITY: SkillIdentity = {
  code: "C4.EXP.04",
  strand_code: "C4.EXP",
  competency_code: "C4",
  name: "Nam châm hút gì",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["predict", "sort"],
  tier: "core",
  prerequisites: ["C4.EXP.01", "C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C4.EXP.04-01",
      behaviour: "Nhận biết và thực hành Nam châm hút gì ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.EXP.04-02",
      behaviour: "Vận dụng Nam châm hút gì trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.EXP.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nam châm hút gì",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_EXP_04_DATASET: SkillDataset = {
  skill_code: "C4.EXP.04",
  concept_label: "Nam châm hút gì",
  surface: "game",
  items: [
    {
      id: "mag_key",
      label: "chìa khóa sắt",
      image: {
        kind: "emoji",
        ref: "🔑",
      },
      category: {
        type: "vật bằng sắt",
      },
      contrast_group: "magnetic",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/mag_key.mp3",
    },
    {
      id: "mag_clip",
      label: "kẹp giấy sắt",
      image: {
        kind: "emoji",
        ref: "📎",
      },
      category: {
        type: "vật bằng sắt",
      },
      contrast_group: "magnetic",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/mag_clip.mp3",
    },
    {
      id: "mag_scissor",
      label: "cây kéo thép",
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "vật bằng sắt",
      },
      contrast_group: "magnetic",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/mag_scissor.mp3",
    },
    {
      id: "mag_screw",
      label: "ốc vít sắt",
      image: {
        kind: "emoji",
        ref: "🔩",
      },
      category: {
        type: "vật bằng sắt",
      },
      contrast_group: "magnetic",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/mag_screw.mp3",
    },
    {
      id: "non_wood",
      label: "khúc gỗ khô",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "vật gỗ nhựa",
      },
      contrast_group: "nonmagnetic",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/non_wood.mp3",
    },
    {
      id: "non_bear",
      label: "gấu bông vải",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "vật gỗ nhựa",
      },
      contrast_group: "nonmagnetic",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/non_bear.mp3",
    },
    {
      id: "non_leaf",
      label: "chiếc lá cây",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "vật gỗ nhựa",
      },
      contrast_group: "nonmagnetic",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/non_leaf.mp3",
    },
    {
      id: "non_ball",
      label: "quả bóng cao su",
      image: {
        kind: "emoji",
        ref: "🏀",
      },
      category: {
        type: "vật gỗ nhựa",
      },
      contrast_group: "nonmagnetic",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/non_ball.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "mag_key",
      target_id: "non_wood",
    },
    {
      type: "contrast",
      source_id: "mag_clip",
      target_id: "non_bear",
    },
    {
      type: "contrast",
      source_id: "mag_scissor",
      target_id: "non_leaf",
    },
    {
      type: "contrast",
      source_id: "mag_screw",
      target_id: "non_ball",
    },
  ],
  axes: {
    magnetism: {
      values: ["vật bằng sắt", "vật gỗ nhựa"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nam châm hút gì",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nam châm hút gì",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nam châm hút gì nhé",
  },
  ordering: [
    "mag_key",
    "mag_clip",
    "mag_scissor",
    "mag_screw",
    "non_wood",
    "non_bear",
    "non_leaf",
    "non_ball",
  ],
};

export const C4_EXP_04_SEED: SkillSeed = {
  identity: C4_EXP_04_IDENTITY,
  dataset: C4_EXP_04_DATASET,
  levels: [
    {
      code: "GL-C4-EXP-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TCMP-0001",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
  ],
};
