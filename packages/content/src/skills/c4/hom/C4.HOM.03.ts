import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_HOM_03_IDENTITY: SkillIdentity = {
  code: "C4.HOM.03",
  strand_code: "C4.HOM",
  competency_code: "C4",
  name: "Trung thu",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["recall", "describe"],
  tier: "basic",
  prerequisites: ["C4.HOM.02"],
  learning_objectives: [
    {
      code: "LO-C4.HOM.03-01",
      behaviour: "Nhận biết và thực hành Trung thu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.HOM.03-02",
      behaviour: "Vận dụng Trung thu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.HOM.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Trung thu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_HOM_03_DATASET: SkillDataset = {
  skill_code: "C4.HOM.03",
  concept_label: "Trung thu",
  surface: "game",
  items: [
    {
      id: "mid_star",
      label: "đèn ông sao",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "đồ chơi lễ",
      },
      contrast_group: "toy",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/mid_star.mp3",
    },
    {
      id: "mid_carp",
      label: "đèn cá chép",
      image: {
        kind: "emoji",
        ref: "🎏",
      },
      category: {
        type: "đồ chơi lễ",
      },
      contrast_group: "toy",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/mid_carp.mp3",
    },
    {
      id: "mid_mask",
      label: "mặt nạ cuội",
      image: {
        kind: "emoji",
        ref: "🎭",
      },
      category: {
        type: "đồ chơi lễ",
      },
      contrast_group: "toy",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/mid_mask.mp3",
    },
    {
      id: "mid_drum",
      label: "trống ếch gõ",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "đồ chơi lễ",
      },
      contrast_group: "toy",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/mid_drum.mp3",
    },
    {
      id: "mid_cake",
      label: "bánh nướng dẻo",
      image: {
        kind: "emoji",
        ref: "🥮",
      },
      category: {
        type: "mâm cỗ trăng",
      },
      contrast_group: "feast",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/mid_cake.mp3",
    },
    {
      id: "mid_moon",
      label: "ánh trăng rằm",
      image: {
        kind: "emoji",
        ref: "🌕",
      },
      category: {
        type: "mâm cỗ trăng",
      },
      contrast_group: "feast",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/mid_moon.mp3",
    },
    {
      id: "mid_pomelo",
      label: "quả bưởi tép",
      image: {
        kind: "emoji",
        ref: "🍈",
      },
      category: {
        type: "mâm cỗ trăng",
      },
      contrast_group: "feast",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/mid_pomelo.mp3",
    },
    {
      id: "mid_banana",
      label: "nải chuối chín",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "mâm cỗ trăng",
      },
      contrast_group: "feast",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/mid_banana.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "mid_star",
      target_id: "mid_cake",
    },
    {
      type: "contrast",
      source_id: "mid_carp",
      target_id: "mid_moon",
    },
    {
      type: "contrast",
      source_id: "mid_mask",
      target_id: "mid_pomelo",
    },
    {
      type: "contrast",
      source_id: "mid_drum",
      target_id: "mid_banana",
    },
  ],
  axes: {
    mid_autumn: {
      values: ["đồ chơi lễ", "mâm cỗ trăng"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Trung thu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trung thu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trung thu nhé",
  },
  ordering: [
    "mid_star",
    "mid_carp",
    "mid_mask",
    "mid_drum",
    "mid_cake",
    "mid_moon",
    "mid_pomelo",
    "mid_banana",
  ],
};

export const C4_HOM_03_SEED: SkillSeed = {
  identity: C4_HOM_03_IDENTITY,
  dataset: C4_HOM_03_DATASET,
  levels: [
    {
      code: "GL-C4-HOM-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-HOM-SIZE-0003",
      template: "GT-009",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
  ],
};
