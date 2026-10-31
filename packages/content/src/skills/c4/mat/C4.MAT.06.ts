import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_06_IDENTITY: SkillIdentity = {
  code: "C4.MAT.06",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Ánh sáng và bóng",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "predict"],
  tier: "core",
  prerequisites: ["C4.OBS.01", "C2.PER.01"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.06-01",
      behaviour: "Nhận biết và thực hành Ánh sáng và bóng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.06-02",
      behaviour: "Vận dụng Ánh sáng và bóng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ánh sáng và bóng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_06_DATASET: SkillDataset = {
  skill_code: "C4.MAT.06",
  concept_label: "Ánh sáng và bóng",
  surface: "game",
  items: [
    {
      id: "src_sun",
      label: "mặt trời sáng",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "nguồn phát sáng",
      },
      contrast_group: "light",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/src_sun.mp3",
    },
    {
      id: "src_bulb",
      label: "bóng đèn sáng",
      image: {
        kind: "emoji",
        ref: "💡",
      },
      category: {
        type: "nguồn phát sáng",
      },
      contrast_group: "light",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/src_bulb.mp3",
    },
    {
      id: "src_candle",
      label: "ngọn nến lung linh",
      image: {
        kind: "emoji",
        ref: "🕯️",
      },
      category: {
        type: "nguồn phát sáng",
      },
      contrast_group: "light",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/src_candle.mp3",
    },
    {
      id: "src_flash",
      label: "đèn pin chiếu",
      image: {
        kind: "emoji",
        ref: "🔦",
      },
      category: {
        type: "nguồn phát sáng",
      },
      contrast_group: "light",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/src_flash.mp3",
    },
    {
      id: "shd_tree",
      label: "tán cây che",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "vật cản sáng",
      },
      contrast_group: "shadow",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/shd_tree.mp3",
    },
    {
      id: "shd_umbrella",
      label: "chiếc ô che",
      image: {
        kind: "emoji",
        ref: "☂️",
      },
      category: {
        type: "vật cản sáng",
      },
      contrast_group: "shadow",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/shd_umbrella.mp3",
    },
    {
      id: "shd_hand",
      label: "bàn tay chắn",
      image: {
        kind: "emoji",
        ref: "✋",
      },
      category: {
        type: "vật cản sáng",
      },
      contrast_group: "shadow",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/shd_hand.mp3",
    },
    {
      id: "shd_wall",
      label: "bức tường chắn",
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "vật cản sáng",
      },
      contrast_group: "shadow",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/shd_wall.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "src_sun",
      target_id: "shd_tree",
    },
    {
      type: "contrast",
      source_id: "src_bulb",
      target_id: "shd_umbrella",
    },
    {
      type: "contrast",
      source_id: "src_candle",
      target_id: "shd_hand",
    },
    {
      type: "contrast",
      source_id: "src_flash",
      target_id: "shd_wall",
    },
  ],
  axes: {
    light_shade: {
      values: ["nguồn phát sáng", "vật cản sáng"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ánh sáng và bóng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ánh sáng và bóng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ánh sáng và bóng nhé",
  },
  ordering: [
    "src_sun",
    "src_bulb",
    "src_candle",
    "src_flash",
    "shd_tree",
    "shd_umbrella",
    "shd_hand",
    "shd_wall",
  ],
};

export const C4_MAT_06_SEED: SkillSeed = {
  identity: C4_MAT_06_IDENTITY,
  dataset: C4_MAT_06_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
  ],
};
