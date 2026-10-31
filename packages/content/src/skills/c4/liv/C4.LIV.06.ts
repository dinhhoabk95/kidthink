import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_LIV_06_IDENTITY: SkillIdentity = {
  code: "C4.LIV.06",
  strand_code: "C4.LIV",
  competency_code: "C4",
  name: "Cây cần gì để lớn",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["infer", "predict"],
  tier: "core",
  prerequisites: ["C4.LIV.01"],
  learning_objectives: [
    {
      code: "LO-C4.LIV.06-01",
      behaviour: "Nhận biết và thực hành Cây cần gì để lớn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.LIV.06-02",
      behaviour: "Vận dụng Cây cần gì để lớn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.LIV.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cây cần gì để lớn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_LIV_06_DATASET: SkillDataset = {
  skill_code: "C4.LIV.06",
  concept_label: "Cây cần gì để lớn",
  surface: "game",
  items: [
    {
      id: "grow_water",
      label: "nước tưới ấm",
      image: {
        kind: "emoji",
        ref: "💧",
      },
      category: {
        type: "cây cần lớn",
      },
      contrast_group: "needed",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/grow_water.mp3",
    },
    {
      id: "grow_sun",
      label: "ánh nắng mặt trời",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "cây cần lớn",
      },
      contrast_group: "needed",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/grow_sun.mp3",
    },
    {
      id: "grow_soil",
      label: "đất màu mỡ",
      image: {
        kind: "emoji",
        ref: "🪴",
      },
      category: {
        type: "cây cần lớn",
      },
      contrast_group: "needed",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/grow_soil.mp3",
    },
    {
      id: "grow_air",
      label: "làn gió mát lành",
      image: {
        kind: "emoji",
        ref: "🌬️",
      },
      category: {
        type: "cây cần lớn",
      },
      contrast_group: "needed",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/grow_air.mp3",
    },
    {
      id: "nogrow_juice",
      label: "nước ngọt có ga",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "đồ chơi đồ dùng",
      },
      contrast_group: "other",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/nogrow_juice.mp3",
    },
    {
      id: "nogrow_toy",
      label: "ô tô đồ chơi",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "đồ chơi đồ dùng",
      },
      contrast_group: "other",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/nogrow_toy.mp3",
    },
    {
      id: "nogrow_ball",
      label: "quả bóng đá",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "đồ chơi đồ dùng",
      },
      contrast_group: "other",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/nogrow_ball.mp3",
    },
    {
      id: "nogrow_candy",
      label: "kẹo đường ngọt",
      image: {
        kind: "emoji",
        ref: "🍬",
      },
      category: {
        type: "đồ chơi đồ dùng",
      },
      contrast_group: "other",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/nogrow_candy.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "grow_water",
      target_id: "nogrow_juice",
    },
    {
      type: "contrast",
      source_id: "grow_sun",
      target_id: "nogrow_toy",
    },
    {
      type: "contrast",
      source_id: "grow_soil",
      target_id: "nogrow_ball",
    },
    {
      type: "contrast",
      source_id: "grow_air",
      target_id: "nogrow_candy",
    },
  ],
  axes: {
    plant_needs: {
      values: ["cây cần lớn", "đồ chơi đồ dùng"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Cây cần gì để lớn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Cây cần gì để lớn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Cây cần gì để lớn nhé",
  },
  ordering: [
    "grow_water",
    "grow_sun",
    "grow_soil",
    "grow_air",
    "nogrow_juice",
    "nogrow_toy",
    "nogrow_ball",
    "nogrow_candy",
  ],
};

export const C4_LIV_06_SEED: SkillSeed = {
  identity: C4_LIV_06_IDENTITY,
  dataset: C4_LIV_06_DATASET,
  levels: [
    {
      code: "GL-C4-LIV-PAIR-0007",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-PAIR-0008",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-LIV-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
  ],
};
