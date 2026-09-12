import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_01_IDENTITY: SkillIdentity = {
  code: "C1.CMP.01",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Lớn hơn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.01-01",
      behaviour: "Nhận biết và thực hành Lớn hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.01-02",
      behaviour: "Vận dụng Lớn hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Lớn hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_01_DATASET: SkillDataset = {
  skill_code: "C1.CMP.01",
  concept_label: "Lớn hơn",
  surface: "game",
  items: [
    {
      id: "size_more",
      label: "quả bóng to",
      glyph: "⚽",
      value: 2,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      contrast_group: "size",
      category: {
        magnitude: "to",
      },
    },
    {
      id: "size_less",
      label: "quả bóng nhỏ",
      glyph: "⚽",
      value: 1,
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      contrast_group: "size",
      category: {
        magnitude: "nhỏ",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "size_more",
      target_id: "size_less",
      metadata: {
        dimension: "size",
      },
    },
  ],
  axes: {
    magnitude: {
      values: ["nhỏ", "to"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với lớn hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng lớn hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt lớn hơn với phương án nhiễu",
      representation: "discrete-object",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi lớn hơn",
      representation: "discrete-object",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục lớn hơn và tự làm một mình",
      representation: "discrete-object",
    },
  ],
  phrasing: {
    prompt_template: "Bên nào có quả to hơn hả bé?",
    narration_template: "Chúng mình cùng tìm hiểu về Lớn hơn nhé",
  },
};

/**
 * Chủ đề làm quen — dataset của bài học mở đầu GL-C1-CMP-INTRO-0001.
 * Dạy so sánh kích thước: Lớn hơn, nhỏ hơn, bằng nhau.
 * Phủ 3 kỹ năng: C1.CMP.01, C1.CMP.02, C1.CMP.03.
 */
const TOPIC_CMP_SIZE_DATASET: SkillDataset = {
  skill_code: "C1.CMP.01",
  concept_label: "Lớn hơn, nhỏ hơn, bằng nhau",
  surface: "game",
  items: [
    {
      id: "big_elephant",
      label: "con voi to",
      glyph: "🐘",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "small_mouse",
      label: "con chuột nhỏ",
      glyph: "🐁",
      image: {
        kind: "emoji",
        ref: "🐁",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "equal_bears",
      label: "hai chú gấu bằng nhau",
      glyph: "🐻",
      image: {
        kind: "emoji",
        ref: "🐻",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "big_car",
      label: "ô tô to",
      glyph: "🚗",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "phương tiện",
      },
    },
    {
      id: "small_bike",
      label: "xe đạp nhỏ",
      glyph: "🚲",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "phương tiện",
      },
    },
    {
      id: "equal_balls",
      label: "hai quả bóng bằng nhau",
      glyph: "⚽",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "đồ chơi",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Nhận biết to và nhỏ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "So sánh to và nhỏ",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy làm quen với {label}",
  },
  ordering: [
    "big_elephant",
    "small_mouse",
    "equal_bears",
    "big_car",
    "small_bike",
    "equal_balls",
  ],
};

export const C1_CMP_01_SEED: SkillSeed = {
  identity: C1_CMP_01_IDENTITY,
  dataset: C1_CMP_01_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-INTRO-0001",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 1,
      dataset: TOPIC_CMP_SIZE_DATASET,
      sequence_no: 1,
      skill_codes: ["C1.CMP.01", "C1.CMP.02", "C1.CMP.03"],
    },
    {
      code: "GL-C3-SIZ-BSK-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D4-03",
    },
    {
      code: "GL-C3-SIZ-BSK-0004",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D4-03",
    },
    {
      code: "GL-C3-SIZ-BSK-0005",
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D4-03",
    },
    {
      code: "GL-C1-CMP-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0004",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0005",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0004",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-MEMO-0005",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
  ],
};
