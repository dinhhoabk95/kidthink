import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_DET_01_IDENTITY: SkillIdentity = {
  code: "C4.DET.01",
  strand_code: "C4.DET",
  competency_code: "C4",
  name: "Quan sát màu",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.DET.01-01",
      behaviour: "Nhận biết và thực hành Quan sát màu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.DET.01-02",
      behaviour: "Vận dụng Quan sát màu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.DET.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quan sát màu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_DET_01_DATASET: SkillDataset = {
  skill_code: "C4.DET.01",
  concept_label: "Quan sát màu",
  surface: "game",
  items: [
    {
      id: "red",
      label: "màu đỏ",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "blue",
      label: "màu xanh dương",
      image: {
        kind: "emoji",
        ref: "🔵",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "yellow",
      label: "màu vàng",
      image: {
        kind: "emoji",
        ref: "🟡",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "green",
      label: "màu xanh lá",
      image: {
        kind: "emoji",
        ref: "🟢",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "orange",
      label: "màu cam",
      image: {
        kind: "emoji",
        ref: "🟠",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "purple",
      label: "màu tím",
      image: {
        kind: "emoji",
        ref: "🟣",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "pink",
      label: "màu hồng",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "brown",
      label: "màu nâu",
      image: {
        kind: "emoji",
        ref: "🟤",
      },
      category: {
        type: "màu sắc",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Quan sát màu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Quan sát màu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Quan sát màu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["spoon", "cup", "bed", "chair", "apple"],
};

/**
 * Chủ đề làm quen — dataset của bài học mở đầu GL-C4-DET-INTRO-0001.
 *
 * Chủ đề không có hàng `skills` riêng (`BR-CTM-01`): nó sống trên chính level dạy
 * qua `SkillLevelPlan.dataset`. Trước 2026-09-06 dataset này treo ở kỹ năng bậc
 * `pre` C4.DET.05, kỹ năng đó đã bị gỡ.
 */
const TOPIC_BASIC_COLOURS_DATASET: SkillDataset = {
  skill_code: "C4.DET.01",
  concept_label: "Làm quen màu cơ bản",
  surface: "game",
  items: [
    {
      id: "red",
      label: "màu đỏ",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "blue",
      label: "màu xanh dương",
      image: {
        kind: "emoji",
        ref: "🔵",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "yellow",
      label: "màu vàng",
      image: {
        kind: "emoji",
        ref: "🟡",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "green",
      label: "màu xanh lá",
      image: {
        kind: "emoji",
        ref: "🟢",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "orange",
      label: "màu cam",
      image: {
        kind: "emoji",
        ref: "🟠",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "purple",
      label: "màu tím",
      image: {
        kind: "emoji",
        ref: "🟣",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "pink",
      label: "màu hồng",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "brown",
      label: "màu nâu",
      image: {
        kind: "emoji",
        ref: "🟤",
      },
      category: {
        type: "màu sắc",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Giới thiệu 8 màu cơ bản qua tai và mắt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng màu sắc",
    },
    {
      rung: 3,
      dimension: "range",
      description: "Gọi tên và phân biệt các màu sắc",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy làm quen với các màu sắc nhé!",
    narration_template: "Chúng mình cùng làm quen với các màu sắc cơ bản nhé",
    success_message: "Hoan hô, bé đã nhận biết đúng màu rồi!",
    hint_message: "Bé hãy lắng nghe và nhìn kỹ màu sắc nhé!",
  },
  ordering: [
    "red",
    "blue",
    "yellow",
    "green",
    "orange",
    "purple",
    "pink",
    "brown",
  ],
};

export const C4_DET_01_SEED: SkillSeed = {
  identity: C4_DET_01_IDENTITY,
  dataset: C4_DET_01_DATASET,
  levels: [
    {
      code: "GL-C4-DET-INTRO-0001",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 1,
      dataset: TOPIC_BASIC_COLOURS_DATASET,
      sequence_no: 1,
      skill_codes: ["C4.DET.01"],
    },
    {
      code: "GL-C4-HID-OBJ-0006",
      template: "GT-022",
      band: "5-6",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D6-06",
    },
    {
      code: "GL-C4-HID-OBJ-0007",
      template: "GT-022",
      band: "5-6",
      difficulty: 1,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D6-06",
    },
    {
      code: "GL-C4-HID-OBJ-0008",
      template: "GT-022",
      band: "5-6",
      difficulty: 2,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D6-06",
    },
    {
      code: "GL-C4-HID-OBJ-0009",
      template: "GT-022",
      band: "5-6",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D6-06",
    },
    {
      code: "GL-C4-HID-OBJ-0010",
      template: "GT-022",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D6-06",
    },
    {
      code: "GL-C4-DET-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-MEMO-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-DET-MEMO-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
  ],
};
