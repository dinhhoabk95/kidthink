import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_07_IDENTITY: SkillIdentity = {
  code: "C1.CMP.07",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Ngắn hơn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.07-01",
      behaviour: "Nhận biết và thực hành Ngắn hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.07-02",
      behaviour: "Vận dụng Ngắn hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.07-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ngắn hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_07_DATASET: SkillDataset = {
  skill_code: "C1.CMP.07",
  concept_label: "Ngắn hơn",
  surface: "game",
  items: [
    {
      id: "cmp07_worm",
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
      id: "cmp07_car",
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
      id: "cmp07_crayon",
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
      id: "cmp07_eraser",
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
      id: "cmp07_pencil",
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
      id: "cmp07_ruler",
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
      id: "cmp07_train",
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
      id: "cmp07_snake",
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
      source_id: "cmp07_worm",
      target_id: "cmp07_pencil",
    },
    {
      type: "contrast",
      source_id: "cmp07_car",
      target_id: "cmp07_ruler",
    },
    {
      type: "contrast",
      source_id: "cmp07_crayon",
      target_id: "cmp07_train",
    },
    {
      type: "contrast",
      source_id: "cmp07_eraser",
      target_id: "cmp07_snake",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ngắn hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng theo yêu cầu ngắn hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt theo yêu cầu ngắn hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so sánh ngắn hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so sánh ngắn hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm vật ngắn hơn nhé",
  },
  ordering: [
    "cmp07_worm",
    "cmp07_car",
    "cmp07_crayon",
    "cmp07_eraser",
    "cmp07_pencil",
    "cmp07_ruler",
    "cmp07_train",
    "cmp07_snake",
  ],
};

export const C1_CMP_07_SEED: SkillSeed = {
  identity: C1_CMP_07_IDENTITY,
  dataset: C1_CMP_07_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-TAP-0027",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0028",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0029",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
    },
  ],
};
