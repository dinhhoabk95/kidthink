import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_HOM_06_IDENTITY: SkillIdentity = {
  code: "C4.HOM.06",
  strand_code: "C4.HOM",
  competency_code: "C4",
  name: "Lễ hội địa phương",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["recall", "describe"],
  tier: "core",
  prerequisites: ["C4.HOM.02"],
  learning_objectives: [
    {
      code: "LO-C4.HOM.06-01",
      behaviour: "Nhận biết và thực hành Lễ hội địa phương ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.HOM.06-02",
      behaviour: "Vận dụng Lễ hội địa phương trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.HOM.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Lễ hội địa phương",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_HOM_06_DATASET: SkillDataset = {
  skill_code: "C4.HOM.06",
  concept_label: "Lễ hội địa phương",
  surface: "game",
  items: [
    {
      id: "fes_boat",
      label: "hội đua thuyền",
      image: {
        kind: "emoji",
        ref: "🚣",
      },
      category: {
        type: "hoạt động hội",
      },
      contrast_group: "activity",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/fes_boat.mp3",
    },
    {
      id: "fes_drum",
      label: "tiếng trống hội",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "hoạt động hội",
      },
      contrast_group: "activity",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/fes_drum.mp3",
    },
    {
      id: "fes_dragon",
      label: "múa rồng vàng",
      image: {
        kind: "emoji",
        ref: "🐉",
      },
      category: {
        type: "hoạt động hội",
      },
      contrast_group: "activity",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/fes_dragon.mp3",
    },
    {
      id: "fes_rope",
      label: "trò chơi kéo co",
      image: {
        kind: "emoji",
        ref: "🪢",
      },
      category: {
        type: "hoạt động hội",
      },
      contrast_group: "activity",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/fes_rope.mp3",
    },
    {
      id: "fes_aodai",
      label: "áo dài thướt tha",
      image: {
        kind: "emoji",
        ref: "👘",
      },
      category: {
        type: "trang phục lễ",
      },
      contrast_group: "costume",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/fes_aodai.mp3",
    },
    {
      id: "fes_hat",
      label: "nón quai thao",
      image: {
        kind: "emoji",
        ref: "👒",
      },
      category: {
        type: "trang phục lễ",
      },
      contrast_group: "costume",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/fes_hat.mp3",
    },
    {
      id: "fes_fan",
      label: "chiếc quạt lụa",
      image: {
        kind: "emoji",
        ref: "🪭",
      },
      category: {
        type: "trang phục lễ",
      },
      contrast_group: "costume",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/fes_fan.mp3",
    },
    {
      id: "fes_flower",
      label: "vòng hoa cài",
      image: {
        kind: "emoji",
        ref: "💐",
      },
      category: {
        type: "trang phục lễ",
      },
      contrast_group: "costume",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/fes_flower.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "fes_boat",
      target_id: "fes_aodai",
    },
    {
      type: "contrast",
      source_id: "fes_drum",
      target_id: "fes_hat",
    },
    {
      type: "contrast",
      source_id: "fes_dragon",
      target_id: "fes_fan",
    },
    {
      type: "contrast",
      source_id: "fes_rope",
      target_id: "fes_flower",
    },
  ],
  axes: {
    fest_type: {
      values: ["hoạt động hội", "trang phục lễ"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Lễ hội địa phương",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Lễ hội địa phương",
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
    narration_template: "Chúng mình cùng tìm hiểu về Lễ hội địa phương nhé",
  },
  ordering: [
    "fes_boat",
    "fes_drum",
    "fes_dragon",
    "fes_rope",
    "fes_aodai",
    "fes_hat",
    "fes_fan",
    "fes_flower",
  ],
};

export const C4_HOM_06_SEED: SkillSeed = {
  identity: C4_HOM_06_IDENTITY,
  dataset: C4_HOM_06_DATASET,
  levels: [
    {
      code: "GL-C4-HOM-PATT-0009",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-PATT-0010",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-MEMO-0005",
      template: "GT-012",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
