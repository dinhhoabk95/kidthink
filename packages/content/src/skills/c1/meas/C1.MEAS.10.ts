import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_10_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.10",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Thời gian: trước/sau",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sequence"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.10-01",
      behaviour: "Nhận biết và thực hành Thời gian: trước/sau ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.10-02",
      behaviour: "Vận dụng Thời gian: trước/sau trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.10-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thời gian: trước/sau",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_10_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.10",
  concept_label: "Thời gian: trước/sau",
  surface: "game",
  items: [
    {
      id: "time_wake",
      label: "thức dậy sớm",
      glyph: "6:00",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      ordering: 1,
      contrast_group: "time_early",
      category: {
        type: "việc làm trước",
        step: "1",
      },
    },
    {
      id: "time_brush",
      label: "đánh răng sạch",
      glyph: "6:30",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🪥",
      },
      ordering: 2,
      contrast_group: "time_early",
      category: {
        type: "việc làm trước",
        step: "2",
      },
    },
    {
      id: "time_breakfast",
      label: "ăn bữa sáng",
      glyph: "7:00",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      ordering: 3,
      contrast_group: "time_early",
      category: {
        type: "việc làm trước",
        step: "3",
      },
    },
    {
      id: "time_school",
      label: "đi đến trường",
      glyph: "7:30",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🏫",
      },
      ordering: 4,
      contrast_group: "time_late",
      category: {
        type: "việc làm sau",
        step: "4",
      },
    },
    {
      id: "time_dinner",
      label: "ăn bữa tối",
      glyph: "18:00",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍲",
      },
      ordering: 5,
      contrast_group: "time_late",
      category: {
        type: "việc làm sau",
        step: "5",
      },
    },
    {
      id: "time_bath",
      label: "tắm bồn sạch sẽ",
      glyph: "17:00",
      value: 7,
      image: {
        kind: "emoji",
        ref: "🛁",
      },
      ordering: 7,
      contrast_group: "time_late",
      category: {
        type: "việc làm sau",
        step: "7",
      },
    },
    {
      id: "time_sleep",
      label: "lên giường ngủ",
      glyph: "21:00",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🛌",
      },
      ordering: 6,
      contrast_group: "time_late",
      category: {
        type: "việc làm sau",
        step: "6",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "time_wake",
      target_id: "time_brush",
    },
    {
      type: "sequence",
      source_id: "time_brush",
      target_id: "time_breakfast",
    },
    {
      type: "sequence",
      source_id: "time_breakfast",
      target_id: "time_school",
    },
    {
      type: "sequence",
      source_id: "time_school",
      target_id: "time_bath",
    },
    {
      type: "sequence",
      source_id: "time_bath",
      target_id: "time_dinner",
    },
    {
      type: "sequence",
      source_id: "time_dinner",
      target_id: "time_sleep",
    },
    {
      type: "contrast",
      source_id: "time_wake",
      target_id: "time_sleep",
      metadata: {
        dimension: "time",
      },
    },
  ],
  axes: {
    step: {
      values: ["1", "2", "3", "4", "5", "6", "7"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với thời gian: trước/sau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng thời gian: trước/sau",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt thời gian: trước/sau với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi thời gian: trước/sau",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục thời gian: trước/sau và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Thời gian: trước/sau nhé",
  },
  ordering: [
    "time_wake",
    "time_brush",
    "time_breakfast",
    "time_school",
    "time_bath",
    "time_dinner",
    "time_sleep",
  ],
};

export const C1_MEAS_10_SEED: SkillSeed = {
  identity: C1_MEAS_10_IDENTITY,
  dataset: C1_MEAS_10_DATASET,
  levels: [
    {
      code: "GL-C1-VOL-TAP-0004",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-VOL-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SLOT-0270",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      access_tier: "free",
      theme: "home",
      rounds: 3,
      montessori_ref: "WB18-D3",
    },
    {
      code: "GL-C1-MEAS-PAIR-0271",
      template: "GT-005",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB18-D3",
    },
    {
      code: "GL-C1-MEAS-SLOT-0272",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB18-D3",
    },
  ],
};
