import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TAC_01_IDENTITY: SkillIdentity = {
  code: "C4.TAC.01",
  strand_code: "C4.TAC",
  competency_code: "C4",
  name: "Nhám – mịn",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["compare", "observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.TAC.01-01",
      behaviour: "Nhận biết và thực hành Nhám – mịn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TAC.01-02",
      behaviour: "Vận dụng Nhám – mịn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TAC.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhám – mịn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TAC_01_DATASET: SkillDataset = {
  skill_code: "C4.TAC.01",
  concept_label: "Nhám – mịn",
  surface: "game",
  items: [
    {
      id: "mirror",
      label: "mặt gương nhẵn",
      image: {
        kind: "emoji",
        ref: "🪞",
      },
      category: {
        type: "vật nhẵn mịn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "smooth",
      audio_path: "/audio/vi/c4/mirror.mp3",
    },
    {
      id: "apple",
      label: "quả táo bóng",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "vật nhẵn mịn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "smooth",
      audio_path: "/audio/vi/c4/apple.mp3",
    },
    {
      id: "ceramic_bowl",
      label: "bát sứ nhẵn",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "vật nhẵn mịn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "smooth",
      audio_path: "/audio/vi/c4/ceramic_bowl.mp3",
    },
    {
      id: "plastic_ball",
      label: "bóng nhựa láng",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "vật nhẵn mịn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "smooth",
      audio_path: "/audio/vi/c4/plastic_ball.mp3",
    },
    {
      id: "pineapple",
      label: "vỏ dứa gai",
      image: {
        kind: "emoji",
        ref: "🍍",
      },
      category: {
        type: "vật nhám ráp",
      },
      value: 1,
      ordering: 5,
      contrast_group: "rough",
      audio_path: "/audio/vi/c4/pineapple.mp3",
    },
    {
      id: "rough_stone",
      label: "hòn đá ráp",
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "vật nhám ráp",
      },
      value: 2,
      ordering: 6,
      contrast_group: "rough",
      audio_path: "/audio/vi/c4/rough_stone.mp3",
    },
    {
      id: "scallop_shell",
      label: "vỏ sò khía",
      image: {
        kind: "emoji",
        ref: "🐚",
      },
      category: {
        type: "vật nhám ráp",
      },
      value: 3,
      ordering: 7,
      contrast_group: "rough",
      audio_path: "/audio/vi/c4/scallop_shell.mp3",
    },
    {
      id: "tree_bark",
      label: "vỏ cây sần",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "vật nhám ráp",
      },
      value: 4,
      ordering: 8,
      contrast_group: "rough",
      audio_path: "/audio/vi/c4/tree_bark.mp3",
    },
  ],
  axes: {
    category: {
      values: ["vật nhẵn mịn", "vật nhám ráp"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "mirror",
      target_id: "pineapple",
    },
    {
      type: "contrast",
      source_id: "apple",
      target_id: "rough_stone",
    },
    {
      type: "contrast",
      source_id: "ceramic_bowl",
      target_id: "scallop_shell",
    },
    {
      type: "contrast",
      source_id: "plastic_ball",
      target_id: "tree_bark",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhám – mịn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhám – mịn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhám – mịn nhé",
  },
  ordering: [
    "mirror",
    "apple",
    "ceramic_bowl",
    "plastic_ball",
    "pineapple",
    "rough_stone",
    "scallop_shell",
    "tree_bark",
  ],
};

export const C4_TAC_01_SEED: SkillSeed = {
  identity: C4_TAC_01_IDENTITY,
  dataset: C4_TAC_01_DATASET,
  levels: [
    {
      code: "GL-C4-TAC-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
  ],
};
