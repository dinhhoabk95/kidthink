import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { findMeasureDimension } from "#src/inventories/index";

export const C1_MEAS_12_INVENTORY_REF = findMeasureDimension("dim_time");

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
      id: "time_morning",
      label: "buổi sáng",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌅",
      },
      contrast_group: "daypart",
      category: {
        daypart: "sáng",
      },
    },
    {
      id: "time_noon",
      label: "buổi trưa",
      value: 2,
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      contrast_group: "daypart",
      category: {
        daypart: "trưa",
      },
    },
    {
      id: "time_afternoon",
      label: "buổi chiều",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🌇",
      },
      contrast_group: "daypart",
      category: {
        daypart: "chiều",
      },
    },
    {
      id: "time_night",
      label: "buổi tối",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      contrast_group: "daypart",
      category: {
        daypart: "tối",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "time_morning",
      target_id: "time_noon",
    },
    {
      type: "sequence",
      source_id: "time_noon",
      target_id: "time_afternoon",
    },
    {
      type: "sequence",
      source_id: "time_afternoon",
      target_id: "time_night",
    },
  ],
  axes: {
    daypart: {
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
    prompt_template: "Đây là buổi nào trong ngày hả bé?",
    narration_template:
      "Chúng mình cùng tìm hiểu về Buổi trong ngày: sáng · trưa · chiều · tối nhé",
  },
  ordering: ["time_morning", "time_noon", "time_afternoon", "time_night"],
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
      code: "GL-C1-MEAS-TAP-0036",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0037",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
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
      code: "GL-C1-MEAS-TCNT-0026",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0027",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0028",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0009",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0010",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0011",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0012",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PAIR-0021",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PAIR-0022",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PAIR-0023",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PAIR-0024",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PATT-0036",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PATT-0037",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PATT-0038",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PATT-0039",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
