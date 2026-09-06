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
      id: "spoon",
      label: "cái thìa",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "cup",
      label: "cái cốc",
      image: {
        kind: "emoji",
        ref: "🥤",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "bed",
      label: "cái giường",
      image: {
        kind: "emoji",
        ref: "🛏️",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "chair",
      label: "cái ghế",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "đồ dùng",
      },
    },
    {
      id: "apple",
      label: "quả táo",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "hoa quả",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Lớn hơn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Lớn hơn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Lớn hơn nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
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
    success_message: "Hoan hô, bé đã nhận biết rất tốt!",
    hint_message: "Bé hãy lắng nghe và nhìn kỹ nhé!",
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
