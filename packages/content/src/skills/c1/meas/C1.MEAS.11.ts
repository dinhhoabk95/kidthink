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
      id: "day_sprout",
      label: "hôm qua nảy mầm",
      glyph: "HQ",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      ordering: 1,
      contrast_group: "past",
      category: {
        type: "ngày hôm qua",
        day: "hôm qua",
      },
    },
    {
      id: "day_flower",
      label: "hôm nay nở hoa",
      glyph: "HN",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      ordering: 2,
      contrast_group: "present",
      category: {
        type: "ngày hôm nay",
        day: "hôm nay",
      },
    },
    {
      id: "day_fruit",
      label: "ngày mai kết quả",
      glyph: "NM",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      ordering: 3,
      contrast_group: "future",
      category: {
        type: "ngày kế tiếp",
        day: "ngày mai",
      },
    },
    {
      id: "day_rain",
      label: "hôm qua trời mưa",
      glyph: "HQ",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      ordering: 4,
      contrast_group: "past",
      category: {
        type: "ngày hôm qua",
        day: "hôm qua",
      },
    },
    {
      id: "day_rainbow",
      label: "hôm nay cầu vồng",
      glyph: "HN",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🌈",
      },
      ordering: 5,
      contrast_group: "present",
      category: {
        type: "ngày hôm nay",
        day: "hôm nay",
      },
    },
    {
      id: "day_sun",
      label: "ngày mai trời nắng",
      glyph: "NM",
      value: 6,
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      ordering: 6,
      contrast_group: "future",
      category: {
        type: "ngày kế tiếp",
        day: "ngày mai",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "day_sprout",
      target_id: "day_flower",
    },
    {
      type: "sequence",
      source_id: "day_flower",
      target_id: "day_fruit",
    },
    {
      type: "sequence",
      source_id: "day_rain",
      target_id: "day_rainbow",
    },
    {
      type: "sequence",
      source_id: "day_rainbow",
      target_id: "day_sun",
    },
  ],
  axes: {
    day: {
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
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về Hôm qua · hôm nay · ngày mai nhé",
  },
  ordering: [
    "day_sprout",
    "day_flower",
    "day_fruit",
    "day_rain",
    "day_rainbow",
    "day_sun",
  ],
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
    },
    {
      code: "GL-C1-VOL-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SLOT-0006",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
