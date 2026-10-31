import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_HOM_02_IDENTITY: SkillIdentity = {
  code: "C4.HOM.02",
  strand_code: "C4.HOM",
  competency_code: "C4",
  name: "Tết cổ truyền",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["recall", "sequence"],
  tier: "basic",
  prerequisites: ["C4.SOC.02"],
  learning_objectives: [
    {
      code: "LO-C4.HOM.02-01",
      behaviour: "Nhận biết và thực hành Tết cổ truyền ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.HOM.02-02",
      behaviour: "Vận dụng Tết cổ truyền trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.HOM.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tết cổ truyền",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_HOM_02_DATASET: SkillDataset = {
  skill_code: "C4.HOM.02",
  concept_label: "Tết cổ truyền",
  surface: "game",
  items: [
    {
      id: "tet_chung",
      label: "bánh chưng xanh",
      image: {
        kind: "emoji",
        ref: "🍙",
      },
      category: {
        type: "món ngày Tết",
      },
      contrast_group: "food",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/tet_chung.mp3",
    },
    {
      id: "tet_melon",
      label: "dưa hấu đỏ",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "món ngày Tết",
      },
      contrast_group: "food",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/tet_melon.mp3",
    },
    {
      id: "tet_jam",
      label: "khay mứt Tết",
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      category: {
        type: "món ngày Tết",
      },
      contrast_group: "food",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/tet_jam.mp3",
    },
    {
      id: "tet_fruit_tray",
      label: "mâm ngũ quả",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "món ngày Tết",
      },
      contrast_group: "food",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/tet_fruit_tray.mp3",
    },
    {
      id: "tet_peach",
      label: "cành hoa đào",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "nét ngày Tết",
      },
      contrast_group: "culture",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/tet_peach.mp3",
    },
    {
      id: "tet_apricot",
      label: "cành hoa mai",
      image: {
        kind: "emoji",
        ref: "🌼",
      },
      category: {
        type: "nét ngày Tết",
      },
      contrast_group: "culture",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/tet_apricot.mp3",
    },
    {
      id: "tet_envelope",
      label: "bao lì xì đỏ",
      image: {
        kind: "emoji",
        ref: "🧧",
      },
      category: {
        type: "nét ngày Tết",
      },
      contrast_group: "culture",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/tet_envelope.mp3",
    },
    {
      id: "tet_lion",
      label: "đầu lân múa hội",
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "nét ngày Tết",
      },
      contrast_group: "culture",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/tet_lion.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "tet_chung",
      target_id: "tet_peach",
    },
    {
      type: "contrast",
      source_id: "tet_melon",
      target_id: "tet_apricot",
    },
    {
      type: "contrast",
      source_id: "tet_jam",
      target_id: "tet_envelope",
    },
    {
      type: "contrast",
      source_id: "tet_fruit_tray",
      target_id: "tet_lion",
    },
  ],
  axes: {
    tet_facet: {
      values: ["món ngày Tết", "nét ngày Tết"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tết cổ truyền",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tết cổ truyền",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tết cổ truyền nhé",
  },
  ordering: [
    "tet_chung",
    "tet_melon",
    "tet_jam",
    "tet_fruit_tray",
    "tet_peach",
    "tet_apricot",
    "tet_envelope",
    "tet_lion",
  ],
};

export const C4_HOM_02_SEED: SkillSeed = {
  identity: C4_HOM_02_IDENTITY,
  dataset: C4_HOM_02_DATASET,
  levels: [
    {
      code: "GL-C4-HOM-PATT-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-PATT-0004",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
  ],
};
