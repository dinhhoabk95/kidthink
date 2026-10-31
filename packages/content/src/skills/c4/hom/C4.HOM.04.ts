import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_HOM_04_IDENTITY: SkillIdentity = {
  code: "C4.HOM.04",
  strand_code: "C4.HOM",
  competency_code: "C4",
  name: "Danh lam thắng cảnh",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "recall"],
  tier: "core",
  prerequisites: ["C4.HOM.01"],
  learning_objectives: [
    {
      code: "LO-C4.HOM.04-01",
      behaviour: "Nhận biết và thực hành Danh lam thắng cảnh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.HOM.04-02",
      behaviour: "Vận dụng Danh lam thắng cảnh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.HOM.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Danh lam thắng cảnh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_HOM_04_DATASET: SkillDataset = {
  skill_code: "C4.HOM.04",
  concept_label: "Danh lam thắng cảnh",
  surface: "game",
  items: [
    {
      id: "vis_bay",
      label: "vịnh biển biếc",
      image: {
        kind: "emoji",
        ref: "🏝️",
      },
      category: {
        type: "cảnh thiên nhiên",
      },
      contrast_group: "nature",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/vis_bay.mp3",
    },
    {
      id: "vis_mountain",
      label: "núi non cao",
      image: {
        kind: "emoji",
        ref: "⛰️",
      },
      category: {
        type: "cảnh thiên nhiên",
      },
      contrast_group: "nature",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/vis_mountain.mp3",
    },
    {
      id: "vis_waterfall",
      label: "thác nước reo",
      image: {
        kind: "emoji",
        ref: "🌊",
      },
      category: {
        type: "cảnh thiên nhiên",
      },
      contrast_group: "nature",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/vis_waterfall.mp3",
    },
    {
      id: "vis_cave",
      label: "hang đá rộng",
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "cảnh thiên nhiên",
      },
      contrast_group: "nature",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/vis_cave.mp3",
    },
    {
      id: "vis_temple",
      label: "ngôi chùa cổ",
      image: {
        kind: "emoji",
        ref: "🛕",
      },
      category: {
        type: "di tích cổ",
      },
      contrast_group: "heritage",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/vis_temple.mp3",
    },
    {
      id: "vis_citadel",
      label: "kinh thành xưa",
      image: {
        kind: "emoji",
        ref: "🏯",
      },
      category: {
        type: "di tích cổ",
      },
      contrast_group: "heritage",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/vis_citadel.mp3",
    },
    {
      id: "vis_bridge",
      label: "cầu cong đẹp",
      image: {
        kind: "emoji",
        ref: "🌉",
      },
      category: {
        type: "di tích cổ",
      },
      contrast_group: "heritage",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/vis_bridge.mp3",
    },
    {
      id: "vis_gate",
      label: "cổng làng xưa",
      image: {
        kind: "emoji",
        ref: "⛩️",
      },
      category: {
        type: "di tích cổ",
      },
      contrast_group: "heritage",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/vis_gate.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "vis_bay",
      target_id: "vis_temple",
    },
    {
      type: "contrast",
      source_id: "vis_mountain",
      target_id: "vis_citadel",
    },
    {
      type: "contrast",
      source_id: "vis_waterfall",
      target_id: "vis_bridge",
    },
    {
      type: "contrast",
      source_id: "vis_cave",
      target_id: "vis_gate",
    },
  ],
  axes: {
    sight_type: {
      values: ["cảnh thiên nhiên", "di tích cổ"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Danh lam thắng cảnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Danh lam thắng cảnh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Danh lam thắng cảnh nhé",
  },
  ordering: [
    "vis_bay",
    "vis_mountain",
    "vis_waterfall",
    "vis_cave",
    "vis_temple",
    "vis_citadel",
    "vis_bridge",
    "vis_gate",
  ],
};

export const C4_HOM_04_SEED: SkillSeed = {
  identity: C4_HOM_04_IDENTITY,
  dataset: C4_HOM_04_DATASET,
  levels: [
    {
      code: "GL-C4-HOM-TAP-0003",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-TAP-0004",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-GNG-0001",
      template: "GT-026",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
