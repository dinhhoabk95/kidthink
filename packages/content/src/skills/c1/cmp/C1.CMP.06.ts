import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { getMeasureDimension } from "#src/inventories/index";

export const C1_CMP_06_IDENTITY: SkillIdentity = {
  code: "C1.CMP.06",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Dài hơn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.06-01",
      behaviour: "Nhận biết và thực hành Dài hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.06-02",
      behaviour: "Vận dụng Dài hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Dài hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_06_DATASET: SkillDataset = {
  skill_code: "C1.CMP.06",
  concept_label: "Dài hơn",
  surface: "game",
  items: [
    {
      id: "length_more",
      label: "bút chì dài",
      value: 2,
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      contrast_group: "length",
      category: {
        length: "dài",
      },
    },
    {
      id: "length_less",
      label: "bút chì ngắn",
      value: 1,
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      contrast_group: "length",
      category: {
        length: "ngắn",
      },
    },
    {
      id: "long_train",
      label: "tàu hỏa dài",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🚆",
      },
      contrast_group: "length",
      category: {
        length: "dài",
      },
    },
    {
      id: "short_car",
      label: "ô tô ngắn",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      contrast_group: "length",
      category: {
        length: "ngắn",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "length_more",
      target_id: "length_less",
      metadata: {
        dimension: getMeasureDimension("dim_length").unit_kind,
      },
    },
  ],
  axes: {
    length: {
      values: ["ngắn", "dài"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với dài hơn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng dài hơn",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt dài hơn với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi dài hơn",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục dài hơn và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Vật nào dài hơn hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Dài hơn nhé",
  },
};

/**
 * Chủ đề làm quen — dataset của bài học mở đầu GL-C1-CMP-INTRO-0003.
 * Dạy so sánh chiều dài và chiều cao: Dài hơn, ngắn hơn, cao hơn, thấp hơn.
 * Phủ 4 kỹ năng: C1.CMP.06, C1.CMP.07, C1.CMP.08, C1.CMP.09.
 */
const TOPIC_CMP_LENGTH_HEIGHT_DATASET: SkillDataset = {
  skill_code: "C1.CMP.06",
  concept_label: "Dài hơn, ngắn hơn, cao hơn, thấp hơn",
  surface: "game",
  items: [
    {
      id: "long_train",
      label: "tàu hỏa dài",
      image: {
        kind: "emoji",
        ref: "🚆",
      },
      category: {
        type: "phương tiện",
      },
    },
    {
      id: "short_car",
      label: "ô tô ngắn",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "phương tiện",
      },
    },
    {
      id: "long_snake",
      label: "chú rắn dài",
      image: {
        kind: "emoji",
        ref: "🐍",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "short_worm",
      label: "chú sâu ngắn",
      image: {
        kind: "emoji",
        ref: "🐛",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "tall_giraffe",
      label: "hươu cao cổ cao",
      image: {
        kind: "emoji",
        ref: "🦒",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "short_rabbit",
      label: "chú thỏ thấp",
      image: {
        kind: "emoji",
        ref: "🐇",
      },
      category: {
        type: "động vật",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Nhận biết dài hơn, ngắn hơn, cao hơn, thấp hơn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "So sánh chiều dài và chiều cao",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy làm quen với {label}",
  },
  ordering: [
    "long_train",
    "short_car",
    "long_snake",
    "short_worm",
    "tall_giraffe",
    "short_rabbit",
  ],
};

export const C1_CMP_06_SEED: SkillSeed = {
  identity: C1_CMP_06_IDENTITY,
  dataset: C1_CMP_06_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-INTRO-0003",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 1,
      dataset: TOPIC_CMP_LENGTH_HEIGHT_DATASET,
      sequence_no: 1,
      skill_codes: ["C1.CMP.06", "C1.CMP.07", "C1.CMP.08", "C1.CMP.09"],
    },
    {
      code: "GL-C3-SIZ-BSK-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
      legacy_v1_ref: "D4-03",
    },
    {
      code: "GL-C3-SIZ-BSK-0010",
      template: "GT-003",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D4-03",
    },
    {
      code: "GL-C1-CMP-TAP-0022",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0023",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0024",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0025",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0026",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0024",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0025",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0026",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0027",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0028",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0024",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0025",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0026",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0027",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0028",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0022",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0023",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0024",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0025",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0026",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
