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
      id: "col_red",
      label: "màu đỏ thắm",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "màu nóng",
      },
      contrast_group: "warm",
      value: 1,
      ordering: 1,
      audio_path: "/audio/voice/màu-đỏ-thắm.mp3",
    },
    {
      id: "col_orange",
      label: "màu cam tươi",
      image: {
        kind: "emoji",
        ref: "🟠",
      },
      category: {
        type: "màu nóng",
      },
      contrast_group: "warm",
      value: 2,
      ordering: 2,
      audio_path: "/audio/voice/màu-cam-tươi.mp3",
    },
    {
      id: "col_yellow",
      label: "màu vàng rực",
      image: {
        kind: "emoji",
        ref: "🟡",
      },
      category: {
        type: "màu nóng",
      },
      contrast_group: "warm",
      value: 3,
      ordering: 3,
      audio_path: "/audio/voice/màu-vàng-rực.mp3",
    },
    {
      id: "col_pink",
      label: "màu hồng phấn",
      image: {
        kind: "emoji",
        ref: "🩷",
      },
      category: {
        type: "màu nóng",
      },
      contrast_group: "warm",
      value: 4,
      ordering: 4,
      audio_path: "/audio/voice/màu-hồng-phấn.mp3",
    },
    {
      id: "col_blue",
      label: "màu xanh dương",
      image: {
        kind: "emoji",
        ref: "🔵",
      },
      category: {
        type: "màu lạnh",
      },
      contrast_group: "cool",
      value: 1,
      ordering: 5,
      audio_path: "/audio/voice/màu-xanh-dương.mp3",
    },
    {
      id: "col_green",
      label: "màu xanh lá",
      image: {
        kind: "emoji",
        ref: "🟢",
      },
      category: {
        type: "màu lạnh",
      },
      contrast_group: "cool",
      value: 2,
      ordering: 6,
      audio_path: "/audio/voice/màu-xanh-lá.mp3",
    },
    {
      id: "col_purple",
      label: "màu tím biếc",
      image: {
        kind: "emoji",
        ref: "🟣",
      },
      category: {
        type: "màu lạnh",
      },
      contrast_group: "cool",
      value: 3,
      ordering: 7,
      audio_path: "/audio/voice/màu-tím-biếc.mp3",
    },
    {
      id: "col_brown",
      label: "màu nâu đất",
      image: {
        kind: "emoji",
        ref: "🟤",
      },
      category: {
        type: "màu lạnh",
      },
      contrast_group: "cool",
      value: 4,
      ordering: 8,
      audio_path: "/audio/voice/màu-nâu-đất.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "col_red",
      target_id: "col_blue",
    },
    {
      type: "contrast",
      source_id: "col_orange",
      target_id: "col_green",
    },
    {
      type: "contrast",
      source_id: "col_yellow",
      target_id: "col_purple",
    },
    {
      type: "contrast",
      source_id: "col_pink",
      target_id: "col_brown",
    },
  ],
  axes: {
    color_group: {
      values: ["màu nóng", "màu lạnh"],
    },
  },
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
  },
  ordering: [
    "col_red",
    "col_orange",
    "col_yellow",
    "col_pink",
    "col_blue",
    "col_green",
    "col_purple",
    "col_brown",
  ],
};

/**
 * Chủ đề làm quen — dataset của bài học mở đầu GL-C4-DET-INTRO-0001.
 *
 * Chủ đề không có hàng `skills` riêng (`BR-CTM-01`): nó sống trên chính level dạy
 * qua `SkillLevelPlan.dataset`. Trước 2026-09-06 dataset này treo ở kỹ năng bậc
 * `pre` C4_DET_05, kỹ năng đó đã bị gỡ.
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
        ref: "🩷",
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
    },
    {
      code: "GL-C4-HID-OBJ-0007",
      template: "GT-022",
      band: "5-6",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-HID-OBJ-0008",
      template: "GT-022",
      band: "5-6",
      difficulty: 2,
      theme: "home",
      rounds: 3,
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
      code: "GL-C4-DET-DROP-6501",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      access_tier: "standard",
      theme: "home",
      rounds: 3,
      sequence_no: 61,
    },
    {
      code: "GL-C4-DET-FLASH-6503",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      access_tier: "standard",
      theme: "nature",
      rounds: 3,
      sequence_no: 63,
    },
    {
      code: "GL-C4-DET-MATCH-6505",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      access_tier: "standard",
      theme: "vehicle",
      rounds: 3,
      sequence_no: 65,
    },
    {
      code: "GL-C4-DET-SLOT-6507",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      access_tier: "standard",
      theme: "body",
      rounds: 3,
      sequence_no: 67,
    },
  ],
};
