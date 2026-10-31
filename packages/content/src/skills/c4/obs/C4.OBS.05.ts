import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_OBS_05_IDENTITY: SkillIdentity = {
  code: "C4.OBS.05",
  strand_code: "C4.OBS",
  competency_code: "C4",
  name: "Dùng kính lúp quan sát",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "verify"],
  tier: "core",
  prerequisites: ["C4.OBS.01"],
  learning_objectives: [
    {
      code: "LO-C4.OBS.05-01",
      behaviour: "Nhận biết và thực hành Dùng kính lúp quan sát ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.OBS.05-02",
      behaviour: "Vận dụng Dùng kính lúp quan sát trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.OBS.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Dùng kính lúp quan sát",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_OBS_05_DATASET: SkillDataset = {
  skill_code: "C4.OBS.05",
  concept_label: "Dùng kính lúp quan sát",
  surface: "game",
  items: [
    {
      id: "ant",
      label: "chú kiến nhỏ",
      image: {
        kind: "emoji",
        ref: "🐜",
      },
      category: {
        type: "côn trùng nhỏ",
      },
      value: 1,
      ordering: 1,
      contrast_group: "insect",
      audio_path: "/audio/vi/c4/ant.mp3",
    },
    {
      id: "ladybug",
      label: "chú bọ rùa",
      image: {
        kind: "emoji",
        ref: "🐞",
      },
      category: {
        type: "côn trùng nhỏ",
      },
      value: 2,
      ordering: 2,
      contrast_group: "insect",
      audio_path: "/audio/vi/c4/ladybug.mp3",
    },
    {
      id: "snail",
      label: "chú ốc sên",
      image: {
        kind: "emoji",
        ref: "🐌",
      },
      category: {
        type: "côn trùng nhỏ",
      },
      value: 3,
      ordering: 3,
      contrast_group: "insect",
      audio_path: "/audio/vi/c4/snail.mp3",
    },
    {
      id: "bee",
      label: "chú ong mật",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "côn trùng nhỏ",
      },
      value: 4,
      ordering: 4,
      contrast_group: "insect",
      audio_path: "/audio/vi/c4/bee.mp3",
    },
    {
      id: "leaf_vein",
      label: "gân lá cây",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "chi tiết nhỏ",
      },
      value: 1,
      ordering: 5,
      contrast_group: "detail",
      audio_path: "/audio/vi/c4/leaf_vein.mp3",
    },
    {
      id: "sand_grain",
      label: "hạt mầm nhỏ",
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      category: {
        type: "chi tiết nhỏ",
      },
      value: 2,
      ordering: 6,
      contrast_group: "detail",
      audio_path: "/audio/vi/c4/sand_grain.mp3",
    },
    {
      id: "petal",
      label: "cánh hoa mỏng",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "chi tiết nhỏ",
      },
      value: 3,
      ordering: 7,
      contrast_group: "detail",
      audio_path: "/audio/vi/c4/petal.mp3",
    },
    {
      id: "dewdrop",
      label: "giọt sương mai",
      image: {
        kind: "emoji",
        ref: "💧",
      },
      category: {
        type: "chi tiết nhỏ",
      },
      value: 4,
      ordering: 8,
      contrast_group: "detail",
      audio_path: "/audio/vi/c4/dewdrop.mp3",
    },
  ],
  axes: {
    category: {
      values: ["côn trùng nhỏ", "chi tiết nhỏ"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "ant",
      target_id: "leaf_vein",
    },
    {
      type: "contrast",
      source_id: "ladybug",
      target_id: "sand_grain",
    },
    {
      type: "contrast",
      source_id: "snail",
      target_id: "petal",
    },
    {
      type: "contrast",
      source_id: "bee",
      target_id: "dewdrop",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Dùng kính lúp quan sát",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dùng kính lúp quan sát",
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
      "Chúng mình cùng tìm hiểu về Dùng kính lúp quan sát nhé",
  },
  ordering: [
    "ant",
    "ladybug",
    "snail",
    "bee",
    "leaf_vein",
    "sand_grain",
    "petal",
    "dewdrop",
  ],
};

export const C4_OBS_05_SEED: SkillSeed = {
  identity: C4_OBS_05_IDENTITY,
  dataset: C4_OBS_05_DATASET,
  levels: [
    {
      code: "GL-C4-OBS-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      template: "GT-032",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
  ],
};
