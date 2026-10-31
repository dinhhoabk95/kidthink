import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TOO_05_IDENTITY: SkillIdentity = {
  code: "C4.TOO.05",
  strand_code: "C4.TOO",
  competency_code: "C4",
  name: "Dùng thiết bị số an toàn",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["plan", "inhibit"],
  tier: "core",
  prerequisites: ["C4.TOO.01"],
  learning_objectives: [
    {
      code: "LO-C4.TOO.05-01",
      behaviour: "Nhận biết và thực hành Dùng thiết bị số an toàn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TOO.05-02",
      behaviour: "Vận dụng Dùng thiết bị số an toàn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TOO.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Dùng thiết bị số an toàn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TOO_05_DATASET: SkillDataset = {
  skill_code: "C4.TOO.05",
  concept_label: "Dùng thiết bị số an toàn",
  surface: "game",
  items: [
    {
      id: "tablet",
      label: "máy tính bảng",
      image: {
        kind: "emoji",
        ref: "📱",
      },
      category: {
        type: "thiết bị học",
      },
      value: 1,
      ordering: 1,
      contrast_group: "device",
      audio_path: "/audio/vi/c4/tablet.mp3",
    },
    {
      id: "computer",
      label: "máy tính bàn",
      image: {
        kind: "emoji",
        ref: "🖥️",
      },
      category: {
        type: "thiết bị học",
      },
      value: 2,
      ordering: 2,
      contrast_group: "device",
      audio_path: "/audio/vi/c4/computer.mp3",
    },
    {
      id: "headphones",
      label: "chiếc tai nghe",
      image: {
        kind: "emoji",
        ref: "🎧",
      },
      category: {
        type: "thiết bị học",
      },
      value: 3,
      ordering: 3,
      contrast_group: "device",
      audio_path: "/audio/vi/c4/headphones.mp3",
    },
    {
      id: "mouse",
      label: "chuột máy tính",
      image: {
        kind: "emoji",
        ref: "🖱️",
      },
      category: {
        type: "thiết bị học",
      },
      value: 4,
      ordering: 4,
      contrast_group: "device",
      audio_path: "/audio/vi/c4/mouse.mp3",
    },
    {
      id: "charger_adult",
      label: "đèn bàn sáng",
      image: {
        kind: "emoji",
        ref: "💡",
      },
      category: {
        type: "đồ bảo vệ",
      },
      value: 1,
      ordering: 5,
      contrast_group: "protection",
      audio_path: "/audio/vi/c4/charger_adult.mp3",
    },
    {
      id: "screen_cloth",
      label: "khăn mềm lau",
      image: {
        kind: "emoji",
        ref: "🧻",
      },
      category: {
        type: "đồ bảo vệ",
      },
      value: 2,
      ordering: 6,
      contrast_group: "protection",
      audio_path: "/audio/vi/c4/screen_cloth.mp3",
    },
    {
      id: "break_timer",
      label: "đồng hồ hẹn",
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      category: {
        type: "đồ bảo vệ",
      },
      value: 3,
      ordering: 7,
      contrast_group: "protection",
      audio_path: "/audio/vi/c4/break_timer.mp3",
    },
    {
      id: "blue_glasses",
      label: "kính bảo vệ",
      image: {
        kind: "emoji",
        ref: "👓",
      },
      category: {
        type: "đồ bảo vệ",
      },
      value: 4,
      ordering: 8,
      contrast_group: "protection",
      audio_path: "/audio/vi/c4/blue_glasses.mp3",
    },
  ],
  axes: {
    category: {
      values: ["thiết bị học", "đồ bảo vệ"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "tablet",
      target_id: "charger_adult",
    },
    {
      type: "contrast",
      source_id: "computer",
      target_id: "screen_cloth",
    },
    {
      type: "contrast",
      source_id: "headphones",
      target_id: "break_timer",
    },
    {
      type: "contrast",
      source_id: "mouse",
      target_id: "blue_glasses",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Dùng thiết bị số an toàn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dùng thiết bị số an toàn",
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
    narration_template:
      "Chúng mình cùng tìm hiểu về Dùng thiết bị số an toàn nhé",
  },
  ordering: [
    "tablet",
    "computer",
    "headphones",
    "mouse",
    "charger_adult",
    "screen_cloth",
    "break_timer",
    "blue_glasses",
  ],
};

export const C4_TOO_05_SEED: SkillSeed = {
  identity: C4_TOO_05_IDENTITY,
  dataset: C4_TOO_05_DATASET,
  levels: [
    {
      code: "GL-C4-TOO-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-TOO-SHAD-0007",
      template: "GT-007",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
