import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_VIS_03_IDENTITY: SkillIdentity = {
  code: "C4.VIS.03",
  strand_code: "C4.VIS",
  competency_code: "C4",
  name: "Tìm vật ẩn trong tranh",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["observe"],
  tier: "core",
  prerequisites: ["C4.VIS.02"],
  learning_objectives: [
    {
      code: "LO-C4.VIS.03-01",
      behaviour:
        "Nhận biết và thực hành Tìm vật ẩn trong tranh (Hidden Object) ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.VIS.03-02",
      behaviour:
        "Vận dụng Tìm vật ẩn trong tranh (Hidden Object) trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.VIS.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm vật ẩn trong tranh (Hidden Object)",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_VIS_03_DATASET: SkillDataset = {
  skill_code: "C4.VIS.03",
  concept_label: "Tìm vật ẩn trong tranh",
  surface: "game",
  items: [
    {
      id: "gecko",
      label: "chú thằn lằn",
      image: {
        kind: "emoji",
        ref: "🦎",
      },
      category: {
        type: "vật ngụy trang",
      },
      value: 1,
      ordering: 1,
      contrast_group: "creature",
      audio_path: "/audio/vi/c4/gecko.mp3",
    },
    {
      id: "caterpillar",
      label: "chú sâu nhỏ",
      image: {
        kind: "emoji",
        ref: "🐛",
      },
      category: {
        type: "vật ngụy trang",
      },
      value: 2,
      ordering: 2,
      contrast_group: "creature",
      audio_path: "/audio/vi/c4/caterpillar.mp3",
    },
    {
      id: "frog",
      label: "chú ếch xanh",
      image: {
        kind: "emoji",
        ref: "🐸",
      },
      category: {
        type: "vật ngụy trang",
      },
      value: 3,
      ordering: 3,
      contrast_group: "creature",
      audio_path: "/audio/vi/c4/frog.mp3",
    },
    {
      id: "ladybug",
      label: "chú bọ rùa",
      image: {
        kind: "emoji",
        ref: "🐞",
      },
      category: {
        type: "vật ngụy trang",
      },
      value: 4,
      ordering: 4,
      contrast_group: "creature",
      audio_path: "/audio/vi/c4/ladybug.mp3",
    },
    {
      id: "golden_key",
      label: "chiếc chìa khóa",
      image: {
        kind: "emoji",
        ref: "🗝️",
      },
      category: {
        type: "đồ vật nhỏ",
      },
      value: 1,
      ordering: 5,
      contrast_group: "item",
      audio_path: "/audio/vi/c4/golden_key.mp3",
    },
    {
      id: "magnifier",
      label: "chiếc kính lúp",
      image: {
        kind: "emoji",
        ref: "🔍",
      },
      category: {
        type: "đồ vật nhỏ",
      },
      value: 2,
      ordering: 6,
      contrast_group: "item",
      audio_path: "/audio/vi/c4/magnifier.mp3",
    },
    {
      id: "tiny_bell",
      label: "quả chuông nhỏ",
      image: {
        kind: "emoji",
        ref: "🔔",
      },
      category: {
        type: "đồ vật nhỏ",
      },
      value: 3,
      ordering: 7,
      contrast_group: "item",
      audio_path: "/audio/vi/c4/tiny_bell.mp3",
    },
    {
      id: "button",
      label: "chiếc cúc áo",
      image: {
        kind: "emoji",
        ref: "🔘",
      },
      category: {
        type: "đồ vật nhỏ",
      },
      value: 4,
      ordering: 8,
      contrast_group: "item",
      audio_path: "/audio/vi/c4/button.mp3",
    },
  ],
  axes: {
    category: {
      values: ["vật ngụy trang", "đồ vật nhỏ"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "gecko",
      target_id: "golden_key",
    },
    {
      type: "contrast",
      source_id: "caterpillar",
      target_id: "magnifier",
    },
    {
      type: "contrast",
      source_id: "frog",
      target_id: "tiny_bell",
    },
    {
      type: "contrast",
      source_id: "ladybug",
      target_id: "button",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm vật ẩn trong tranh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm vật ẩn trong tranh",
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
      "Chúng mình cùng tìm hiểu về Tìm vật ẩn trong tranh nhé",
  },
  ordering: [
    "gecko",
    "caterpillar",
    "frog",
    "ladybug",
    "golden_key",
    "magnifier",
    "tiny_bell",
    "button",
  ],
};

export const C4_VIS_03_SEED: SkillSeed = {
  identity: C4_VIS_03_IDENTITY,
  dataset: C4_VIS_03_DATASET,
  levels: [
    {
      code: "GL-C4-OBS-CARD-0001",
      template: "GT-012",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-SUB-FAST-0010",
      template: "GT-012",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-BOX-0014",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-FLIP-0032",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
  ],
};
