import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { getMeasureDimension } from "#src/inventories/index";

export const C1_MEAS_09_DIMENSION = getMeasureDimension("dim_length");

export const C1_MEAS_09_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.09",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Đo bằng thước",
  age_min: 6,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["count", "verify"],
  tier: "advanced",
  prerequisites: ["C1.MEAS.08"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.09-01",
      behaviour: "Nhận biết và thực hành Đo bằng thước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.09-02",
      behaviour: "Vận dụng Đo bằng thước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đo bằng thước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_09_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.09",
  concept_label: "Đo bằng thước",
  surface: "game",
  items: [
    {
      id: "cm_3",
      label: "dài ba xăng-ti-mét",
      value: 3,
      audio_path: "/audio/voice/d5/unit_result_template/cm_3.mp3",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      contrast_group: "ruler",
      category: {
        length_cm: "3cm",
      },
    },
    {
      id: "cm_4",
      label: "dài bốn xăng-ti-mét",
      value: 4,
      audio_path: "/audio/voice/d5/unit_result_template/cm_4.mp3",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      contrast_group: "ruler",
      category: {
        length_cm: "4cm",
      },
    },
    {
      id: "cm_5",
      label: "dài năm xăng-ti-mét",
      value: 5,
      audio_path: "/audio/voice/d5/unit_result_template/cm_5.mp3",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      contrast_group: "ruler",
      category: {
        length_cm: "5cm",
      },
    },
    {
      id: "cm_6",
      label: "dài sáu xăng-ti-mét",
      value: 6,
      audio_path: "/audio/voice/d5/unit_result_template/cm_6.mp3",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      contrast_group: "ruler",
      category: {
        length_cm: "6cm",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "cm_3",
      target_id: "cm_4",
    },
    {
      type: "sequence",
      source_id: "cm_4",
      target_id: "cm_5",
    },
    {
      type: "sequence",
      source_id: "cm_5",
      target_id: "cm_6",
    },
    {
      type: "contrast",
      source_id: "cm_6",
      target_id: "cm_3",
      metadata: {
        near_miss: true,
      },
    },
  ],
  axes: {
    length_cm: {
      values: ["3cm", "4cm", "5cm", "6cm"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đo bằng thước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đo bằng thước",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt đo bằng thước với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đo bằng thước",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đo bằng thước và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé đọc xem thước chỉ mấy xăng-ti-mét nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Đo bằng thước nhé",
  },
};

export const C1_MEAS_09_SEED: SkillSeed = {
  identity: C1_MEAS_09_IDENTITY,
  dataset: C1_MEAS_09_DATASET,
  levels: [
    {
      code: "GL-C1-RUL-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D5-05",
    },
    {
      code: "GL-C1-RUL-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D5-05",
    },
    {
      code: "GL-C1-MEAS-TAP-0030",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0031",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0032",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0033",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0021",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0022",
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0023",
      template: "GT-002",
      band: "5-6",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0024",
      template: "GT-002",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0005",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0006",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0007",
      template: "GT-003",
      band: "5-6",
      difficulty: 5,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0008",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SHAD-0020",
      template: "GT-007",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SHAD-0021",
      template: "GT-007",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SHAD-0022",
      template: "GT-007",
      band: "5-6",
      difficulty: 5,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-SHAD-0023",
      template: "GT-007",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MEMO-0016",
      template: "GT-012",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MEMO-0017",
      template: "GT-012",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MEMO-0018",
      template: "GT-012",
      band: "5-6",
      difficulty: 5,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-MEMO-0019",
      template: "GT-012",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
  ],
};
