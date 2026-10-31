import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_LIV_01_IDENTITY: SkillIdentity = {
  code: "C4.LIV.01",
  strand_code: "C4.LIV",
  competency_code: "C4",
  name: "Bộ phận của cây",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: ["C4.DET.02"],
  learning_objectives: [
    {
      code: "LO-C4.LIV.01-01",
      behaviour: "Nhận biết và thực hành Bộ phận của cây ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.LIV.01-02",
      behaviour: "Vận dụng Bộ phận của cây trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.LIV.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Bộ phận của cây",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_LIV_01_DATASET: SkillDataset = {
  skill_code: "C4.LIV.01",
  concept_label: "Bộ phận của cây",
  surface: "game",
  items: [
    {
      id: "plt_leaf",
      label: "lá cây xanh",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "bộ phận trên",
      },
      contrast_group: "top",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/plt_leaf.mp3",
    },
    {
      id: "plt_flower",
      label: "bông hoa nở",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "bộ phận trên",
      },
      contrast_group: "top",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/plt_flower.mp3",
    },
    {
      id: "plt_fruit",
      label: "quả ngọt lành",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "bộ phận trên",
      },
      contrast_group: "top",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/plt_fruit.mp3",
    },
    {
      id: "plt_branch",
      label: "cành cây cao",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "bộ phận trên",
      },
      contrast_group: "top",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/plt_branch.mp3",
    },
    {
      id: "plt_root",
      label: "rễ cây bám đất",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "bộ phận dưới",
      },
      contrast_group: "bottom",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/plt_root.mp3",
    },
    {
      id: "plt_seed",
      label: "hạt giống nhỏ",
      image: {
        kind: "emoji",
        ref: "🌰",
      },
      category: {
        type: "bộ phận dưới",
      },
      contrast_group: "bottom",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/plt_seed.mp3",
    },
    {
      id: "plt_tuber",
      label: "củ khoai lang",
      image: {
        kind: "emoji",
        ref: "🥔",
      },
      category: {
        type: "bộ phận dưới",
      },
      contrast_group: "bottom",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/plt_tuber.mp3",
    },
    {
      id: "plt_onion",
      label: "củ hành trắng",
      image: {
        kind: "emoji",
        ref: "🧅",
      },
      category: {
        type: "bộ phận dưới",
      },
      contrast_group: "bottom",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/plt_onion.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "plt_leaf",
      target_id: "plt_root",
    },
    {
      type: "contrast",
      source_id: "plt_flower",
      target_id: "plt_seed",
    },
    {
      type: "contrast",
      source_id: "plt_fruit",
      target_id: "plt_tuber",
    },
    {
      type: "contrast",
      source_id: "plt_branch",
      target_id: "plt_onion",
    },
  ],
  axes: {
    plant_part: {
      values: ["bộ phận trên", "bộ phận dưới"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Bộ phận của cây",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Bộ phận của cây",
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
    narration_template: "Chúng mình cùng tìm hiểu về Bộ phận của cây nhé",
  },
  ordering: [
    "plt_leaf",
    "plt_flower",
    "plt_fruit",
    "plt_branch",
    "plt_root",
    "plt_seed",
    "plt_tuber",
    "plt_onion",
  ],
};

export const C4_LIV_01_SEED: SkillSeed = {
  identity: C4_LIV_01_IDENTITY,
  dataset: C4_LIV_01_DATASET,
  levels: [
    {
      code: "GL-C4-LIV-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
