import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TOO_03_IDENTITY: SkillIdentity = {
  code: "C4.TOO.03",
  strand_code: "C4.TOO",
  competency_code: "C4",
  name: "Kính lúp",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "verify"],
  tier: "core",
  prerequisites: ["C4.OBS.05"],
  learning_objectives: [
    {
      code: "LO-C4.TOO.03-01",
      behaviour: "Nhận biết và thực hành Kính lúp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TOO.03-02",
      behaviour: "Vận dụng Kính lúp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TOO.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Kính lúp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TOO_03_DATASET: SkillDataset = {
  skill_code: "C4.TOO.03",
  concept_label: "Kính lúp",
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
        type: "vật bé nhỏ",
      },
      value: 1,
      ordering: 1,
      contrast_group: "small",
      audio_path: "/audio/vi/c4/ant.mp3",
    },
    {
      id: "leaf_pattern",
      label: "gân lá cây",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "vật bé nhỏ",
      },
      value: 2,
      ordering: 2,
      contrast_group: "small",
      audio_path: "/audio/vi/c4/leaf_pattern.mp3",
    },
    {
      id: "ladybug",
      label: "chú bọ rùa",
      image: {
        kind: "emoji",
        ref: "🐞",
      },
      category: {
        type: "vật bé nhỏ",
      },
      value: 3,
      ordering: 3,
      contrast_group: "small",
      audio_path: "/audio/vi/c4/ladybug.mp3",
    },
    {
      id: "caterpillar",
      label: "chú sâu nhỏ",
      image: {
        kind: "emoji",
        ref: "🐛",
      },
      category: {
        type: "vật bé nhỏ",
      },
      value: 4,
      ordering: 4,
      contrast_group: "small",
      audio_path: "/audio/vi/c4/caterpillar.mp3",
    },
    {
      id: "big_tree",
      label: "cây cổ thụ",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "vật to lớn",
      },
      value: 1,
      ordering: 5,
      contrast_group: "large",
      audio_path: "/audio/vi/c4/big_tree.mp3",
    },
    {
      id: "house",
      label: "ngôi nhà cao",
      image: {
        kind: "emoji",
        ref: "🏠",
      },
      category: {
        type: "vật to lớn",
      },
      value: 2,
      ordering: 6,
      contrast_group: "large",
      audio_path: "/audio/vi/c4/house.mp3",
    },
    {
      id: "big_ball",
      label: "quả bóng to",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "vật to lớn",
      },
      value: 3,
      ordering: 7,
      contrast_group: "large",
      audio_path: "/audio/vi/c4/big_ball.mp3",
    },
    {
      id: "elephant",
      label: "chú voi to",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "vật to lớn",
      },
      value: 4,
      ordering: 8,
      contrast_group: "large",
      audio_path: "/audio/vi/c4/elephant.mp3",
    },
  ],
  axes: {
    category: {
      values: ["vật bé nhỏ", "vật to lớn"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "ant",
      target_id: "big_tree",
    },
    {
      type: "contrast",
      source_id: "leaf_pattern",
      target_id: "house",
    },
    {
      type: "contrast",
      source_id: "ladybug",
      target_id: "big_ball",
    },
    {
      type: "contrast",
      source_id: "caterpillar",
      target_id: "elephant",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Kính lúp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Kính lúp",
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
    narration_template: "Chúng mình cùng tìm hiểu về Kính lúp nhé",
  },
  ordering: [
    "ant",
    "leaf_pattern",
    "ladybug",
    "caterpillar",
    "big_tree",
    "house",
    "big_ball",
    "elephant",
  ],
};

export const C4_TOO_03_SEED: SkillSeed = {
  identity: C4_TOO_03_IDENTITY,
  dataset: C4_TOO_03_DATASET,
  levels: [
    {
      code: "GL-C4-TOO-TAP-0001",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-TAP-0002",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
  ],
};
