import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_QUE_04_IDENTITY: SkillIdentity = {
  code: "C5.QUE.04",
  strand_code: "C5.QUE",
  competency_code: "C5",
  name: 'Trả lời "Khi nào?"',
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "sequence"],
  tier: "advanced",
  prerequisites: ["C5.QUE.02", "C1.MEAS.10"],
  learning_objectives: [
    {
      code: "LO-C5.QUE.04-01",
      behaviour: 'Nhận biết và thực hành Trả lời "Khi nào?" ở mức cơ bản',
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.QUE.04-02",
      behaviour: 'Vận dụng Trả lời "Khi nào?" trong môi trường tương tác',
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.QUE.04-03",
      behaviour: 'Giải quyết vấn đề nâng cao liên quan tới Trả lời "Khi nào?"',
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_QUE_04_DATASET: SkillDataset = {
  skill_code: "C5.QUE.04",
  concept_label: 'Trả lời "Khi nào?"',
  surface: "game",
  items: [
    {
      id: "que_sang_som",
      label: "sáng sớm thức dậy",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🌅",
      },
      audio_path: "/audio/vi/c5/que/buoi_sang.mp3",
      category: {
        type: "buổi ban ngày",
      },
      contrast_group: "primary",
    },
    {
      id: "que_buoi_sang",
      label: "buổi sáng đi học",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      audio_path: "/audio/vi/c5/que/buoi_sang.mp3",
      category: {
        type: "buổi ban ngày",
      },
      contrast_group: "primary",
    },
    {
      id: "que_buoi_trua",
      label: "buổi trưa ăn cơm",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      audio_path: "/audio/vi/c5/que/buoi_trua.mp3",
      category: {
        type: "buổi ban ngày",
      },
      contrast_group: "primary",
    },
    {
      id: "que_buoi_chieu",
      label: "buổi chiều tan trường",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "🌇",
      },
      audio_path: "/audio/vi/c5/que/buoi_chieu.mp3",
      category: {
        type: "buổi chiều tối",
      },
      contrast_group: "contrast",
    },
    {
      id: "que_buoi_toi",
      label: "buổi tối ăn cơm",
      value: 5,
      ordering: 5,
      image: {
        kind: "emoji",
        ref: "🍲",
      },
      audio_path: "/audio/vi/c5/que/buoi_toi.mp3",
      category: {
        type: "buổi chiều tối",
      },
      contrast_group: "contrast",
    },
    {
      id: "que_ban_dem",
      label: "ban đêm đi ngủ",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      audio_path: "/audio/vi/c5/que/buoi_toi.mp3",
      category: {
        type: "buổi chiều tối",
      },
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: 'Làm quen cơ bản với Trả lời "Khi nào?"',
    },
    {
      rung: 2,
      dimension: "range",
      description: 'Nhận biết và chọn đúng Trả lời "Khi nào?"',
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
    narration_template: 'Chúng mình cùng tìm hiểu về Trả lời "Khi nào?" nhé',
  },
  ordering: [
    "que_sang_som",
    "que_buoi_sang",
    "que_buoi_trua",
    "que_buoi_chieu",
    "que_buoi_toi",
    "que_ban_dem",
  ],
  axes: {
    category: {
      values: ["buổi ban ngày", "buổi chiều tối"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "sequence",
      source_id: "que_sang_som",
      target_id: "que_buoi_sang",
    },
    {
      type: "sequence",
      source_id: "que_buoi_chieu",
      target_id: "que_buoi_toi",
    },
    {
      type: "pair",
      source_id: "que_sang_som",
      target_id: "que_buoi_trua",
    },
    {
      type: "contrast",
      source_id: "que_sang_som",
      target_id: "que_ban_dem",
    },
  ],
};

export const C5_QUE_04_SEED: SkillSeed = {
  identity: C5_QUE_04_IDENTITY,
  dataset: C5_QUE_04_DATASET,
  levels: [
    {
      code: "GL-C5-QUE-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SORT-0002",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-QUE-SLOT-0001",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
  ],
};
