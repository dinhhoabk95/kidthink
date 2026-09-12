import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_11_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.11",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Hôm qua · hôm nay · ngày mai",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sequence"],
  tier: "core",
  prerequisites: ["C1.MEAS.10"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.11-01",
      behaviour:
        "Nhận biết và thực hành Hôm qua · hôm nay · ngày mai ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.11-02",
      behaviour:
        "Vận dụng Hôm qua · hôm nay · ngày mai trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.11-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Hôm qua · hôm nay · ngày mai",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_11_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.11",
  concept_label: "Hôm qua · hôm nay · ngày mai",
  surface: "game",
  items: [
    {
      id: "day_yesterday",
      label: "hôm qua",
      glyph: "📅",
      value: 1,
      image: {
        kind: "emoji",
        ref: "📅",
      },
      contrast_group: "calendar",
      category: {
        day_order: "hôm qua",
      },
    },
    {
      id: "day_today",
      label: "hôm nay",
      glyph: "📆",
      value: 2,
      image: {
        kind: "emoji",
        ref: "📆",
      },
      contrast_group: "calendar",
      category: {
        day_order: "hôm nay",
      },
    },
    {
      id: "day_tomorrow",
      label: "ngày mai",
      glyph: "🗓️",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🗓️",
      },
      contrast_group: "calendar",
      category: {
        day_order: "ngày mai",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "day_yesterday",
      target_id: "day_today",
    },
    {
      type: "sequence",
      source_id: "day_today",
      target_id: "day_tomorrow",
    },
  ],
  axes: {
    day_order: {
      values: ["hôm qua", "hôm nay", "ngày mai"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với hôm qua · hôm nay · ngày mai",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng hôm qua · hôm nay · ngày mai",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt hôm qua · hôm nay · ngày mai với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi hôm qua · hôm nay · ngày mai",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục hôm qua · hôm nay · ngày mai và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Hôm nay là ngày nào hả bé?",
    narration_template:
      "Chúng mình cùng tìm hiểu về Hôm qua · hôm nay · ngày mai nhé",
  },
  ordering: ["day_yesterday", "day_today", "day_tomorrow"],
};

export const C1_MEAS_11_SEED: SkillSeed = {
  identity: C1_MEAS_11_IDENTITY,
  dataset: C1_MEAS_11_DATASET,
  levels: [
    {
      code: "GL-C1-VOL-TAP-0007",
      template: "GT-001",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D5-01",
    },
    {
      code: "GL-C1-VOL-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D5-01",
    },
    {
      code: "GL-C1-VOL-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D5-01",
    },
    {
      code: "GL-C1-VOL-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D5-01",
    },
    {
      code: "GL-C1-MEAS-SLOT-0006",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SLOT-0007",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SLOT-0008",
      template: "GT-008",
      band: "3-4",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SLOT-0009",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SLOT-0010",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MAZE-0006",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MAZE-0007",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MAZE-0008",
      template: "GT-013",
      band: "4-5",
      difficulty: 4,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MAZE-0009",
      template: "GT-013",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MAZE-0010",
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-BOND-0006",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-BOND-0007",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-BOND-0008",
      template: "GT-018",
      band: "4-5",
      difficulty: 4,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-BOND-0009",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-BOND-0010",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MTRX-0006",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MTRX-0007",
      template: "GT-023",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MTRX-0008",
      template: "GT-023",
      band: "4-5",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MTRX-0009",
      template: "GT-023",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MTRX-0010",
      template: "GT-023",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
  ],
};
