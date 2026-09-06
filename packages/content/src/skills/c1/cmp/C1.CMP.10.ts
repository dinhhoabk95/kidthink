import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_10_IDENTITY: SkillIdentity = {
  code: "C1.CMP.10",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Nặng hơn",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.10-01",
      behaviour: "Nhận biết và thực hành Nặng hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.10-02",
      behaviour: "Vận dụng Nặng hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.10-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nặng hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_10_DATASET: SkillDataset = {
  skill_code: "C1.CMP.10",
  concept_label: "Nặng hơn",
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
      description: "Làm quen cơ bản với Nặng hơn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nặng hơn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nặng hơn nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

/**
 * Chủ đề làm quen — dataset của bài học mở đầu GL-C1-CMP-INTRO-0004.
 * Dạy so sánh sức nặng, khoảng cách và tốc độ: Nặng hơn, nhẹ hơn, xa hơn, gần hơn, nhanh hơn, chậm hơn.
 * Phủ 6 kỹ năng: C1.CMP.10, C1.CMP.11, C1.CMP.12, C1.CMP.13, C1.CMP.14, C1.CMP.15.
 */
const TOPIC_CMP_MEASURE_SPEED_DATASET: SkillDataset = {
  skill_code: "C1.CMP.10",
  concept_label: "Nặng hơn, nhẹ hơn, xa hơn, gần hơn, nhanh hơn, chậm hơn",
  surface: "game",
  items: [
    {
      id: "heavy_truck",
      label: "xe tải nặng",
      glyph: "🚛",
      image: {
        kind: "emoji",
        ref: "🚛",
      },
      category: {
        type: "phương tiện",
      },
    },
    {
      id: "light_leaf",
      label: "chiếc lá nhẹ",
      glyph: "🍃",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "thiên nhiên",
      },
    },
    {
      id: "far_plane",
      label: "máy bay ở xa",
      glyph: "✈️",
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "phương tiện",
      },
    },
    {
      id: "near_flower",
      label: "bông hoa ở gần",
      glyph: "🌺",
      image: {
        kind: "emoji",
        ref: "🌺",
      },
      category: {
        type: "thiên nhiên",
      },
    },
    {
      id: "fast_cheetah",
      label: "chú báo chạy nhanh",
      glyph: "🐆",
      image: {
        kind: "emoji",
        ref: "🐆",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "slow_turtle",
      label: "chú rùa bò chậm",
      glyph: "🐢",
      image: {
        kind: "emoji",
        ref: "🐢",
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
      description: "Nhận biết nặng hơn, nhẹ hơn, bằng nhau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "So sánh trọng lượng và cân bằng",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy làm quen với {label}",
    success_message: "Hoan hô, bé đã nhận biết rất tốt!",
    hint_message: "Bé hãy lắng nghe và nhìn kỹ nhé!",
  },
  ordering: [
    "heavy_truck",
    "light_leaf",
    "far_plane",
    "near_flower",
    "fast_cheetah",
    "slow_turtle",
  ],
};

export const C1_CMP_10_SEED: SkillSeed = {
  identity: C1_CMP_10_IDENTITY,
  dataset: C1_CMP_10_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-INTRO-0004",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 1,
      dataset: TOPIC_CMP_MEASURE_SPEED_DATASET,
      sequence_no: 1,
      skill_codes: [
        "C1.CMP.10",
        "C1.CMP.11",
        "C1.CMP.12",
        "C1.CMP.13",
        "C1.CMP.14",
        "C1.CMP.15",
      ],
    },
    {
      code: "GL-C1-VOL-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D5-01",
    },
    {
      code: "GL-C1-CMP-TAP-0042",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0043",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0044",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0044",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0045",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0046",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0047",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0044",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0045",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0046",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-SHAD-0047",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
