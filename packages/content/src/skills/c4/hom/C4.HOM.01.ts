import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_HOM_01_IDENTITY: SkillIdentity = {
  code: "C4.HOM.01",
  strand_code: "C4.HOM",
  competency_code: "C4",
  name: "Cờ Tổ quốc",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "recall"],
  tier: "basic",
  prerequisites: ["C4.DET.01"],
  learning_objectives: [
    {
      code: "LO-C4.HOM.01-01",
      behaviour: "Nhận biết và thực hành Cờ Tổ quốc ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.HOM.01-02",
      behaviour: "Vận dụng Cờ Tổ quốc trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.HOM.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cờ Tổ quốc",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_HOM_01_DATASET: SkillDataset = {
  skill_code: "C4.HOM.01",
  concept_label: "Cờ Tổ quốc",
  surface: "game",
  items: [
    {
      id: "vn_flag",
      label: "lá cờ Việt Nam",
      image: {
        kind: "emoji",
        ref: "🇻🇳",
      },
      category: {
        type: "cờ Tổ quốc",
      },
      contrast_group: "flag",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/vn_flag.mp3",
    },
    {
      id: "vn_star",
      label: "ngôi sao vàng",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "cờ Tổ quốc",
      },
      contrast_group: "flag",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/vn_star.mp3",
    },
    {
      id: "vn_red",
      label: "nền cờ đỏ",
      image: {
        kind: "emoji",
        ref: "🟥",
      },
      category: {
        type: "cờ Tổ quốc",
      },
      contrast_group: "flag",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/vn_red.mp3",
    },
    {
      id: "vn_pole",
      label: "cột cờ đỏ",
      image: {
        kind: "emoji",
        ref: "🚩",
      },
      category: {
        type: "cờ Tổ quốc",
      },
      contrast_group: "flag",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/vn_pole.mp3",
    },
    {
      id: "vn_lotus",
      label: "hoa sen hồng",
      image: {
        kind: "emoji",
        ref: "🪷",
      },
      category: {
        type: "nét quê hương",
      },
      contrast_group: "homeland",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/vn_lotus.mp3",
    },
    {
      id: "vn_bamboo",
      label: "cây tre xanh",
      image: {
        kind: "emoji",
        ref: "🎋",
      },
      category: {
        type: "nét quê hương",
      },
      contrast_group: "homeland",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/vn_bamboo.mp3",
    },
    {
      id: "vn_hat",
      label: "chiếc nón lá",
      image: {
        kind: "emoji",
        ref: "👒",
      },
      category: {
        type: "nét quê hương",
      },
      contrast_group: "homeland",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/vn_hat.mp3",
    },
    {
      id: "vn_map",
      label: "bản đồ chữ S",
      image: {
        kind: "emoji",
        ref: "🗺️",
      },
      category: {
        type: "nét quê hương",
      },
      contrast_group: "homeland",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/vn_map.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "vn_flag",
      target_id: "vn_lotus",
    },
    {
      type: "contrast",
      source_id: "vn_star",
      target_id: "vn_bamboo",
    },
    {
      type: "contrast",
      source_id: "vn_red",
      target_id: "vn_hat",
    },
    {
      type: "contrast",
      source_id: "vn_pole",
      target_id: "vn_map",
    },
  ],
  axes: {
    flag_group: {
      values: ["cờ Tổ quốc", "nét quê hương"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Cờ Tổ quốc",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Cờ Tổ quốc",
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
    narration_template: "Chúng mình cùng tìm hiểu về Cờ Tổ quốc nhé",
  },
  ordering: [
    "vn_flag",
    "vn_star",
    "vn_red",
    "vn_pole",
    "vn_lotus",
    "vn_bamboo",
    "vn_hat",
    "vn_map",
  ],
};

export const C4_HOM_01_SEED: SkillSeed = {
  identity: C4_HOM_01_IDENTITY,
  dataset: C4_HOM_01_DATASET,
  levels: [
    {
      code: "GL-C4-HOM-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
