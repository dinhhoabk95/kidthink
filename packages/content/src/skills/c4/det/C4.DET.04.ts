import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_DET_04_IDENTITY: SkillIdentity = {
  code: "C4.DET.04",
  strand_code: "C4.DET",
  competency_code: "C4",
  name: "Quan sát vị trí",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["observe"],
  tier: "core",
  prerequisites: ["C2.ORI.03"],
  learning_objectives: [
    {
      code: "LO-C4.DET.04-01",
      behaviour: "Nhận biết và thực hành Quan sát vị trí ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.DET.04-02",
      behaviour: "Vận dụng Quan sát vị trí trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.DET.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quan sát vị trí",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_DET_04_DATASET: SkillDataset = {
  skill_code: "C4.DET.04",
  concept_label: "Quan sát vị trí",
  surface: "game",
  items: [
    {
      id: "pos_bird",
      label: "chú chim trên cành",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "vật trên cao",
      },
      contrast_group: "high",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/pos_bird.mp3",
    },
    {
      id: "pos_kite",
      label: "cánh diều bay cao",
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      category: {
        type: "vật trên cao",
      },
      contrast_group: "high",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/pos_kite.mp3",
    },
    {
      id: "pos_cloud",
      label: "đám mây trên trời",
      image: {
        kind: "emoji",
        ref: "☁️",
      },
      category: {
        type: "vật trên cao",
      },
      contrast_group: "high",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/pos_cloud.mp3",
    },
    {
      id: "pos_airplane",
      label: "máy bay trên trời",
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "vật trên cao",
      },
      contrast_group: "high",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/pos_airplane.mp3",
    },
    {
      id: "pos_cat",
      label: "chú mèo dưới đất",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "vật dưới đất",
      },
      contrast_group: "low",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/pos_cat.mp3",
    },
    {
      id: "pos_flower",
      label: "bông hoa dưới đất",
      image: {
        kind: "emoji",
        ref: "🌻",
      },
      category: {
        type: "vật dưới đất",
      },
      contrast_group: "low",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/pos_flower.mp3",
    },
    {
      id: "pos_mushroom",
      label: "cây nấm dưới đất",
      image: {
        kind: "emoji",
        ref: "🍄",
      },
      category: {
        type: "vật dưới đất",
      },
      contrast_group: "low",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/pos_mushroom.mp3",
    },
    {
      id: "pos_turtle",
      label: "chú rùa dưới đất",
      image: {
        kind: "emoji",
        ref: "🐢",
      },
      category: {
        type: "vật dưới đất",
      },
      contrast_group: "low",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/pos_turtle.mp3",
    },
    // --- Ngữ liệu WB03: Phân biệt tư thế & động tác ---
    {
      id: "bear_wave_left",
      label: "chú gấu vẫy tay trái",
      image: { kind: "emoji", ref: "🧸" },
      contrast_group: "bear_pose",
      category: { type: "tư thế gấu", pose_arm: "tay trái giơ vẫy" },
      value: 1,
      ordering: 9,
    },
    {
      id: "bear_cheer_both",
      label: "chú gấu giơ hai tay",
      image: { kind: "emoji", ref: "🧸" },
      contrast_group: "bear_pose",
      category: { type: "tư thế gấu", pose_arm: "hai tay giơ cao" },
      value: 2,
      ordering: 10,
    },
    {
      id: "bear_arms_down",
      label: "chú gấu xuôi hai tay",
      image: { kind: "emoji", ref: "🧸" },
      contrast_group: "bear_pose",
      category: { type: "tư thế gấu", pose_arm: "hai tay buông xuôi" },
      value: 3,
      ordering: 11,
    },
    {
      id: "bear_point_right",
      label: "chú gấu chỉ tay phải",
      image: { kind: "emoji", ref: "🧸" },
      contrast_group: "bear_pose",
      category: { type: "tư thế gấu", pose_arm: "tay phải chỉ ngang" },
      value: 4,
      ordering: 12,
    },
    {
      id: "dancer_ballet",
      label: "vũ công múa ballet",
      image: { kind: "emoji", ref: "🩰" },
      contrast_group: "action_pose",
      category: { type: "tư thế vận động" },
      value: 5,
      ordering: 13,
    },
    {
      id: "boy_scooter",
      label: "bé trai đi xe trượt",
      image: { kind: "emoji", ref: "🛴" },
      contrast_group: "action_pose",
      category: { type: "tư thế vận động" },
      value: 6,
      ordering: 14,
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "pos_bird",
      target_id: "pos_cat",
    },
    {
      type: "contrast",
      source_id: "pos_kite",
      target_id: "pos_flower",
    },
    {
      type: "contrast",
      source_id: "pos_cloud",
      target_id: "pos_mushroom",
    },
    {
      type: "contrast",
      source_id: "pos_airplane",
      target_id: "pos_turtle",
    },
    {
      type: "contrast",
      source_id: "bear_wave_left",
      target_id: "bear_cheer_both",
    },
    {
      type: "contrast",
      source_id: "bear_arms_down",
      target_id: "bear_point_right",
    },
  ],
  axes: {
    position: {
      values: ["vật trên cao", "vật dưới đất", "tư thế gấu", "tư thế vận động"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Quan sát vị trí",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Quan sát vị trí",
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
    narration_template: "Chúng mình cùng tìm hiểu về Quan sát vị trí nhé",
  },
  ordering: [
    "pos_bird",
    "pos_kite",
    "pos_cloud",
    "pos_airplane",
    "pos_cat",
    "pos_flower",
    "pos_mushroom",
    "pos_turtle",
    "bear_wave_left",
    "bear_cheer_both",
    "bear_arms_down",
    "bear_point_right",
    "dancer_ballet",
    "boy_scooter",
  ],
};

export const C4_DET_04_SEED: SkillSeed = {
  identity: C4_DET_04_IDENTITY,
  dataset: C4_DET_04_DATASET,
  levels: [
    {
      code: "GL-C4-DET-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    // --- Bổ sung Montessori WB03 ---
    {
      code: "GL-C4-DET-PAIR-0141",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "home",
      rounds: 3,
      montessori_ref: "WB03-D1",
      skill_codes: ["C4.DET.04", "C2.ORI.01", "C2.ORI.02"],
    },
    {
      code: "GL-C4-DET-TAP-0142",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB03-D2",
      skill_codes: ["C4.DET.04", "C2.ORI.02"],
    },
    {
      code: "GL-C4-DET-PAIR-0143",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB03-D1",
      skill_codes: ["C4.DET.04", "C4.VIS.01"],
    },
  ],
};
