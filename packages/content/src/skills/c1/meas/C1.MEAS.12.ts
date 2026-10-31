import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_12_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.12",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Buổi trong ngày: sáng · trưa · chiều · tối",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sequence", "observe"],
  tier: "basic",
  prerequisites: ["C1.MEAS.10"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.12-01",
      behaviour:
        "Nhận biết và thực hành Buổi trong ngày: sáng · trưa · chiều · tối ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.12-02",
      behaviour:
        "Vận dụng Buổi trong ngày: sáng · trưa · chiều · tối trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.12-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Buổi trong ngày: sáng · trưa · chiều · tối",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_12_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.12",
  concept_label: "Buổi trong ngày: sáng · trưa · chiều · tối",
  surface: "game",
  items: [
    {
      id: "meas12-i1",
      label: "bình minh buổi sáng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌅",
      },
      ordering: 1,
      contrast_group: "time_morning",
      category: {
        type: "buổi ban sáng",
        period: "sáng",
      },
    },
    {
      id: "meas12-i2",
      label: "gà gáy buổi sáng",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🐓",
      },
      ordering: 2,
      contrast_group: "time_morning",
      category: {
        type: "buổi ban sáng",
        period: "sáng",
      },
    },
    {
      id: "meas12-i3",
      label: "mặt trời buổi trưa",
      value: 3,
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      ordering: 3,
      contrast_group: "time_noon",
      category: {
        type: "buổi ban trưa",
        period: "trưa",
      },
    },
    {
      id: "meas12-i4",
      label: "ăn cơm buổi trưa",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🍱",
      },
      ordering: 4,
      contrast_group: "time_noon",
      category: {
        type: "buổi ban trưa",
        period: "trưa",
      },
    },
    {
      id: "meas12-i5",
      label: "hoàng hôn buổi chiều",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🌇",
      },
      ordering: 5,
      contrast_group: "time_afternoon",
      category: {
        type: "buổi ban chiều",
        period: "chiều",
      },
    },
    {
      id: "meas12-i6",
      label: "đá bóng buổi chiều",
      value: 6,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      ordering: 6,
      contrast_group: "time_afternoon",
      category: {
        type: "buổi ban chiều",
        period: "chiều",
      },
    },
    {
      id: "meas12-i7",
      label: "mặt trăng buổi tối",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      ordering: 7,
      contrast_group: "time_night",
      category: {
        type: "buổi ban tối",
        period: "tối",
      },
    },
    {
      id: "meas12-i8",
      label: "ngôi sao buổi tối",
      value: 8,
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      ordering: 8,
      contrast_group: "time_night",
      category: {
        type: "buổi ban tối",
        period: "tối",
      },
    },
    {
      id: "routine_wake_up",
      label: "thức dậy buổi sáng",
      glyph: "6:00",
      value: 9,
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      ordering: 9,
      contrast_group: "time_morning",
      category: {
        type: "hoạt động trong ngày",
        period: "sáng",
      },
    },
    {
      id: "routine_eat_lunch",
      label: "ăn cơm buổi trưa",
      glyph: "11:30",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🍱",
      },
      ordering: 10,
      contrast_group: "time_noon",
      category: {
        type: "hoạt động trong ngày",
        period: "trưa",
      },
    },
    {
      id: "routine_play_sports",
      label: "vui chơi buổi chiều",
      glyph: "16:00",
      value: 11,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      ordering: 11,
      contrast_group: "time_afternoon",
      category: {
        type: "hoạt động trong ngày",
        period: "chiều",
      },
    },
    {
      id: "routine_go_to_sleep",
      label: "đi ngủ buổi tối",
      glyph: "21:00",
      value: 12,
      image: {
        kind: "emoji",
        ref: "🛌",
      },
      ordering: 12,
      contrast_group: "time_night",
      category: {
        type: "hoạt động trong ngày",
        period: "tối",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "meas12-i1",
      target_id: "meas12-i3",
    },
    {
      type: "sequence",
      source_id: "meas12-i3",
      target_id: "meas12-i5",
    },
    {
      type: "sequence",
      source_id: "meas12-i5",
      target_id: "meas12-i7",
    },
    {
      type: "contrast",
      source_id: "meas12-i1",
      target_id: "meas12-i7",
      metadata: {
        dimension: "time_of_day",
      },
    },
    {
      type: "pair",
      source_id: "routine_wake_up",
      target_id: "meas12-i1",
      metadata: {
        relation: "buổi sáng",
      },
    },
    {
      type: "pair",
      source_id: "routine_go_to_sleep",
      target_id: "meas12-i7",
      metadata: {
        relation: "buổi tối",
      },
    },
  ],
  axes: {
    period: {
      values: ["sáng", "trưa", "chiều", "tối"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description:
        "Làm quen cơ bản với buổi trong ngày: sáng · trưa · chiều · tối",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng buổi trong ngày: sáng · trưa · chiều · tối",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description:
        "Phân biệt buổi trong ngày: sáng · trưa · chiều · tối với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi buổi trong ngày: sáng · trưa · chiều · tối",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description:
        "Thuần thục buổi trong ngày: sáng · trưa · chiều · tối và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về Buổi trong ngày: sáng · trưa · chiều · tối nhé",
  },
  ordering: [
    "meas12-i1",
    "meas12-i2",
    "meas12-i3",
    "meas12-i4",
    "meas12-i5",
    "meas12-i6",
    "meas12-i7",
    "meas12-i8",
    "routine_wake_up",
    "routine_eat_lunch",
    "routine_play_sports",
    "routine_go_to_sleep",
  ],
};

export const C1_MEAS_12_SEED: SkillSeed = {
  identity: C1_MEAS_12_IDENTITY,
  dataset: C1_MEAS_12_DATASET,
  levels: [
    {
      code: "GL-C1-MEAS-TAP-0034",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0035",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0025",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0273",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "home",
      rounds: 3,
      montessori_ref: "WB18-D3",
    },
    {
      code: "GL-C1-MEAS-PAIR-0274",
      template: "GT-005",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB18-D3",
    },
    {
      code: "GL-C1-MEAS-TAP-0275",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB18-D3",
    },
  ],
};
