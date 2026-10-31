import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TOO_01_IDENTITY: SkillIdentity = {
  code: "C4.TOO.01",
  strand_code: "C4.TOO",
  competency_code: "C4",
  name: "Ngồi đúng, nghỉ mắt",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["plan", "inhibit"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.TOO.01-01",
      behaviour: "Nhận biết và thực hành Ngồi đúng, nghỉ mắt ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TOO.01-02",
      behaviour: "Vận dụng Ngồi đúng, nghỉ mắt trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TOO.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ngồi đúng, nghỉ mắt",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TOO_01_DATASET: SkillDataset = {
  skill_code: "C4.TOO.01",
  concept_label: "Ngồi đúng, nghỉ mắt",
  surface: "game",
  items: [
    {
      id: "sit_straight",
      label: "ghế ngồi thẳng",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "thói quen mắt",
      },
      value: 1,
      ordering: 1,
      contrast_group: "habit",
      audio_path: "/audio/vi/c4/sit_straight.mp3",
    },
    {
      id: "safe_distance",
      label: "thước canh chuẩn",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "thói quen mắt",
      },
      value: 2,
      ordering: 2,
      contrast_group: "habit",
      audio_path: "/audio/vi/c4/safe_distance.mp3",
    },
    {
      id: "look_green",
      label: "cây xanh mát",
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      category: {
        type: "thói quen mắt",
      },
      value: 3,
      ordering: 3,
      contrast_group: "habit",
      audio_path: "/audio/vi/c4/look_green.mp3",
    },
    {
      id: "blink_rest",
      label: "đôi mắt sáng",
      image: {
        kind: "emoji",
        ref: "👀",
      },
      category: {
        type: "thói quen mắt",
      },
      value: 4,
      ordering: 4,
      contrast_group: "habit",
      audio_path: "/audio/vi/c4/blink_rest.mp3",
    },
    {
      id: "study_lamp",
      label: "đèn bàn sáng",
      image: {
        kind: "emoji",
        ref: "💡",
      },
      category: {
        type: "đồ dùng học",
      },
      value: 1,
      ordering: 5,
      contrast_group: "item",
      audio_path: "/audio/vi/c4/study_lamp.mp3",
    },
    {
      id: "safe_glasses",
      label: "kính bảo vệ",
      image: {
        kind: "emoji",
        ref: "👓",
      },
      category: {
        type: "đồ dùng học",
      },
      value: 2,
      ordering: 6,
      contrast_group: "item",
      audio_path: "/audio/vi/c4/safe_glasses.mp3",
    },
    {
      id: "timer_clock",
      label: "đồng hồ hẹn",
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      category: {
        type: "đồ dùng học",
      },
      value: 3,
      ordering: 7,
      contrast_group: "item",
      audio_path: "/audio/vi/c4/timer_clock.mp3",
    },
    {
      id: "sun_window",
      label: "cửa sổ sáng",
      image: {
        kind: "emoji",
        ref: "🪟",
      },
      category: {
        type: "đồ dùng học",
      },
      value: 4,
      ordering: 8,
      contrast_group: "item",
      audio_path: "/audio/vi/c4/sun_window.mp3",
    },
  ],
  axes: {
    category: {
      values: ["thói quen mắt", "đồ dùng học"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "sit_straight",
      target_id: "study_lamp",
    },
    {
      type: "contrast",
      source_id: "safe_distance",
      target_id: "safe_glasses",
    },
    {
      type: "contrast",
      source_id: "look_green",
      target_id: "timer_clock",
    },
    {
      type: "contrast",
      source_id: "blink_rest",
      target_id: "sun_window",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ngồi đúng, nghỉ mắt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ngồi đúng, nghỉ mắt",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ngồi đúng, nghỉ mắt nhé",
  },
  ordering: [
    "sit_straight",
    "safe_distance",
    "look_green",
    "blink_rest",
    "study_lamp",
    "safe_glasses",
    "timer_clock",
    "sun_window",
  ],
};

export const C4_TOO_01_SEED: SkillSeed = {
  identity: C4_TOO_01_IDENTITY,
  dataset: C4_TOO_01_DATASET,
  levels: [
    {
      code: "GL-C4-TOO-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
  ],
};
