import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SRT_04_IDENTITY: SkillIdentity = {
  code: "C3.SRT.04",
  strand_code: "C3.SRT",
  competency_code: "C3",
  name: "Sắp xếp theo chiều dài",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["sequence", "compare"],
  tier: "basic",
  prerequisites: ["C1.MEAS.01"],
  learning_objectives: [
    {
      code: "LO-C3.SRT.04-01",
      behaviour: "Nhận biết và thực hành Sắp xếp theo chiều dài ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SRT.04-02",
      behaviour: "Vận dụng Sắp xếp theo chiều dài trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SRT.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Sắp xếp theo chiều dài",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SRT_04_DATASET: SkillDataset = {
  skill_code: "C3.SRT.04",
  concept_label: "Sắp xếp theo chiều dài",
  surface: "game",
  items: [
    {
      id: "short_eraser",
      label: "cục tẩy ngắn",
      image: {
        kind: "emoji",
        ref: "🧼",
      },
      category: {
        type: "đồ dùng ngắn",
      },
      contrast_group: "length_short",
      value: 1,
      ordering: 1,
    },
    {
      id: "short_worm",
      label: "chú giun ngắn",
      image: {
        kind: "emoji",
        ref: "🪱",
      },
      category: {
        type: "đồ dùng ngắn",
      },
      contrast_group: "length_short",
      value: 2,
      ordering: 2,
    },
    {
      id: "medium_crayon",
      label: "bút sáp vừa",
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
      category: {
        type: "đồ dùng ngắn",
      },
      contrast_group: "length_short",
      value: 3,
      ordering: 3,
    },
    {
      id: "medium_fish",
      label: "chú cá vừa",
      image: {
        kind: "emoji",
        ref: "🐟",
      },
      category: {
        type: "đồ dùng ngắn",
      },
      contrast_group: "length_short",
      value: 4,
      ordering: 4,
    },
    {
      id: "long_pencil",
      label: "bút chì dài",
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "đồ dùng dài",
      },
      contrast_group: "length_long",
      value: 5,
      ordering: 5,
    },
    {
      id: "very_long_ruler",
      label: "thước kẻ dài",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "đồ dùng dài",
      },
      contrast_group: "length_long",
      value: 6,
      ordering: 6,
    },
    {
      id: "long_snake",
      label: "con rắn dài",
      image: {
        kind: "emoji",
        ref: "🐍",
      },
      category: {
        type: "đồ dùng dài",
      },
      contrast_group: "length_long",
      value: 7,
      ordering: 7,
    },
    {
      id: "very_long_crocodile",
      label: "cá sấu rất dài",
      image: {
        kind: "emoji",
        ref: "🐊",
      },
      category: {
        type: "đồ dùng dài",
      },
      contrast_group: "length_long",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      source_id: "short_eraser",
      target_id: "short_worm",
      type: "sequence",
    },
    {
      source_id: "short_worm",
      target_id: "medium_crayon",
      type: "sequence",
    },
    {
      source_id: "medium_crayon",
      target_id: "medium_fish",
      type: "sequence",
    },
    {
      source_id: "medium_fish",
      target_id: "long_pencil",
      type: "sequence",
    },
    {
      source_id: "long_pencil",
      target_id: "very_long_ruler",
      type: "sequence",
    },
    {
      source_id: "very_long_ruler",
      target_id: "long_snake",
      type: "sequence",
    },
    {
      source_id: "long_snake",
      target_id: "very_long_crocodile",
      type: "sequence",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen hai vật có chiều dài khác nhau",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Sắp xếp ba vật theo thứ tự từ ngắn đến dài",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Sắp xếp bốn vật theo thứ tự chiều dài",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Nhận biết vị trí thích hợp trong dãy chiều dài",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Hoàn thành dãy chiều dài độc lập",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng xếp các vật từ ngắn đến dài nhé",
  },
  ordering: [
    "short_eraser",
    "short_worm",
    "medium_crayon",
    "medium_fish",
    "long_pencil",
    "very_long_ruler",
    "long_snake",
    "very_long_crocodile",
  ],
};

export const C3_SRT_04_SEED: SkillSeed = {
  identity: C3_SRT_04_IDENTITY,
  dataset: C3_SRT_04_DATASET,
  levels: [
    {
      code: "GL-C3-COL-BSK-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      template: "GT-016",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
    },
    {
      template: "GT-016",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
    },
    {
      template: "GT-016",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
    },
  ],
};
