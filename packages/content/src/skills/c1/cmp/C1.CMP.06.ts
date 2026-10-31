import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

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

const TOPIC_CMP_LENGTH_HEIGHT_DATASET: SkillDataset = {
  skill_code: "C1.CMP.06",
  concept_label: "So sánh chiều dài",
  surface: "game",
  items: [
    {
      id: "topic_short_worm",
      label: "con sâu ngắn",
      glyph: "🐛",
      value: 1,
      contrast_group: "length",
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🐛",
      },
      category: {
        type: "đồ vật ngắn",
      },
    },
    {
      id: "topic_short_crayon",
      label: "bút sáp ngắn",
      glyph: "🖍️",
      value: 2,
      contrast_group: "length",
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
      category: {
        type: "đồ vật ngắn",
      },
    },
    {
      id: "topic_long_ruler",
      label: "thước kẻ dài",
      glyph: "📏",
      value: 4,
      contrast_group: "length",
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "đồ vật dài",
      },
    },
    {
      id: "topic_long_snake",
      label: "con rắn dài",
      glyph: "🐍",
      value: 5,
      contrast_group: "length",
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "🐍",
      },
      category: {
        type: "đồ vật dài",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "topic_short_worm",
      target_id: "topic_long_snake",
    },
    {
      type: "contrast",
      source_id: "topic_short_crayon",
      target_id: "topic_long_ruler",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so sánh",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng so sánh chiều dài nhé",
  },
  ordering: [
    "topic_short_worm",
    "topic_short_crayon",
    "topic_long_ruler",
    "topic_long_snake",
  ],
};

export const C1_CMP_06_DATASET: SkillDataset = {
  skill_code: "C1.CMP.06",
  concept_label: "Dài hơn",
  surface: "game",
  items: [
    {
      id: "cmp06_worm",
      label: "con sâu ngắn",
      glyph: "🐛",
      value: 1,
      contrast_group: "length",
      ordering: 1,
      category: {
        type: "đồ vật ngắn",
      },
      image: {
        kind: "emoji",
        ref: "🐛",
      },
    },
    {
      id: "cmp06_car",
      label: "ô tô ngắn",
      glyph: "🚗",
      value: 1,
      contrast_group: "length",
      ordering: 2,
      category: {
        type: "đồ vật ngắn",
      },
      image: {
        kind: "emoji",
        ref: "🚗",
      },
    },
    {
      id: "cmp06_crayon",
      label: "bút sáp ngắn",
      glyph: "🖍️",
      value: 2,
      contrast_group: "length",
      ordering: 3,
      category: {
        type: "đồ vật ngắn",
      },
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
    },
    {
      id: "cmp06_eraser",
      label: "cục tẩy ngắn",
      glyph: "🧽",
      value: 2,
      contrast_group: "length",
      ordering: 4,
      category: {
        type: "đồ vật ngắn",
      },
      image: {
        kind: "emoji",
        ref: "🧽",
      },
    },
    {
      id: "cmp06_pencil",
      label: "bút chì dài",
      glyph: "✏️",
      value: 4,
      contrast_group: "length",
      ordering: 5,
      category: {
        type: "đồ vật dài",
      },
      image: {
        kind: "emoji",
        ref: "✏️",
      },
    },
    {
      id: "cmp06_ruler",
      label: "thước kẻ dài",
      glyph: "📏",
      value: 5,
      contrast_group: "length",
      ordering: 6,
      category: {
        type: "đồ vật dài",
      },
      image: {
        kind: "emoji",
        ref: "📏",
      },
    },
    {
      id: "cmp06_train",
      label: "tàu hoả dài",
      glyph: "🚂",
      value: 5,
      contrast_group: "length",
      ordering: 7,
      category: {
        type: "đồ vật dài",
      },
      image: {
        kind: "emoji",
        ref: "🚂",
      },
    },
    {
      id: "cmp06_snake",
      label: "con rắn dài",
      glyph: "🐍",
      value: 5,
      contrast_group: "length",
      ordering: 8,
      category: {
        type: "đồ vật dài",
      },
      image: {
        kind: "emoji",
        ref: "🐍",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "cmp06_worm",
      target_id: "cmp06_snake",
    },
    {
      type: "contrast",
      source_id: "cmp06_car",
      target_id: "cmp06_train",
    },
    {
      type: "contrast",
      source_id: "cmp06_crayon",
      target_id: "cmp06_ruler",
    },
    {
      type: "contrast",
      source_id: "cmp06_eraser",
      target_id: "cmp06_pencil",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với vật dài hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng vật dài hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt vật dài hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng so sánh vật dài hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so sánh dài hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm vật dài hơn nhé",
  },
  ordering: [
    "cmp06_worm",
    "cmp06_car",
    "cmp06_crayon",
    "cmp06_eraser",
    "cmp06_pencil",
    "cmp06_ruler",
    "cmp06_train",
    "cmp06_snake",
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
  ],
};
