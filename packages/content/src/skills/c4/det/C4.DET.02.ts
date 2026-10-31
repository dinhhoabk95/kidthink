import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_DET_02_IDENTITY: SkillIdentity = {
  code: "C4.DET.02",
  strand_code: "C4.DET",
  competency_code: "C4",
  name: "Quan sát hình",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: ["C2.GEO.01"],
  learning_objectives: [
    {
      code: "LO-C4.DET.02-01",
      behaviour: "Nhận biết và thực hành Quan sát hình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.DET.02-02",
      behaviour: "Vận dụng Quan sát hình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.DET.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quan sát hình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_DET_02_DATASET: SkillDataset = {
  skill_code: "C4.DET.02",
  concept_label: "Quan sát hình",
  surface: "game",
  items: [
    {
      id: "shp_ball",
      label: "quả bóng tròn",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "vật hình tròn",
      },
      contrast_group: "circle",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/shp_ball.mp3",
    },
    {
      id: "shp_clock",
      label: "đồng hồ tròn",
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      category: {
        type: "vật hình tròn",
      },
      contrast_group: "circle",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/shp_clock.mp3",
    },
    {
      id: "shp_donut",
      label: "bánh vòng tròn",
      image: {
        kind: "emoji",
        ref: "🍩",
      },
      category: {
        type: "vật hình tròn",
      },
      contrast_group: "circle",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/shp_donut.mp3",
    },
    {
      id: "shp_wheel",
      label: "bánh xe tròn",
      image: {
        kind: "emoji",
        ref: "🛞",
      },
      category: {
        type: "vật hình tròn",
      },
      contrast_group: "circle",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/shp_wheel.mp3",
    },
    {
      id: "shp_gift",
      label: "hộp quà vuông",
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "vật hình vuông",
      },
      contrast_group: "square",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/shp_gift.mp3",
    },
    {
      id: "shp_frame",
      label: "khung ảnh vuông",
      image: {
        kind: "emoji",
        ref: "🖼️",
      },
      category: {
        type: "vật hình vuông",
      },
      contrast_group: "square",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/shp_frame.mp3",
    },
    {
      id: "shp_window",
      label: "khung cửa sổ",
      image: {
        kind: "emoji",
        ref: "🪟",
      },
      category: {
        type: "vật hình vuông",
      },
      contrast_group: "square",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/shp_window.mp3",
    },
    {
      id: "shp_dice",
      label: "viên xúc xắc",
      image: {
        kind: "emoji",
        ref: "🎲",
      },
      category: {
        type: "vật hình vuông",
      },
      contrast_group: "square",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/shp_dice.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "shp_ball",
      target_id: "shp_gift",
    },
    {
      type: "contrast",
      source_id: "shp_clock",
      target_id: "shp_frame",
    },
    {
      type: "contrast",
      source_id: "shp_donut",
      target_id: "shp_window",
    },
    {
      type: "contrast",
      source_id: "shp_wheel",
      target_id: "shp_dice",
    },
  ],
  axes: {
    shape_type: {
      values: ["vật hình tròn", "vật hình vuông"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Quan sát hình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Quan sát hình",
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
    narration_template: "Chúng mình cùng tìm hiểu về Quan sát hình nhé",
  },
  ordering: [
    "shp_ball",
    "shp_clock",
    "shp_donut",
    "shp_wheel",
    "shp_gift",
    "shp_frame",
    "shp_window",
    "shp_dice",
  ],
};

export const C4_DET_02_SEED: SkillSeed = {
  identity: C4_DET_02_IDENTITY,
  dataset: C4_DET_02_DATASET,
  levels: [
    {
      code: "GL-C4-DET-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
