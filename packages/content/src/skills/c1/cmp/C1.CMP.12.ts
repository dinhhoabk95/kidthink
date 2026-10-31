import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_12_IDENTITY: SkillIdentity = {
  code: "C1.CMP.12",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Xa hơn",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.12-01",
      behaviour: "Nhận biết và thực hành Xa hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.12-02",
      behaviour: "Vận dụng Xa hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.12-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Xa hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_12_DATASET: SkillDataset = {
  skill_code: "C1.CMP.12",
  concept_label: "Xa hơn",
  surface: "game",
  items: [
    {
      id: "cmp12_cloud",
      label: "đám mây gần",
      glyph: "☁️",
      value: 1,
      contrast_group: "distance",
      ordering: 1,
      category: {
        type: "vị trí gần",
      },
      image: {
        kind: "emoji",
        ref: "☁️",
      },
    },
    {
      id: "cmp12_tree",
      label: "cây xanh gần",
      glyph: "🌳",
      value: 1,
      contrast_group: "distance",
      ordering: 2,
      category: {
        type: "vị trí gần",
      },
      image: {
        kind: "emoji",
        ref: "🌳",
      },
    },
    {
      id: "cmp12_car",
      label: "ô tô ở gần",
      glyph: "🚗",
      value: 2,
      contrast_group: "distance",
      ordering: 3,
      category: {
        type: "vị trí gần",
      },
      image: {
        kind: "emoji",
        ref: "🚗",
      },
    },
    {
      id: "cmp12_boat",
      label: "thuyền ở gần",
      glyph: "⛵",
      value: 2,
      contrast_group: "distance",
      ordering: 4,
      category: {
        type: "vị trí gần",
      },
      image: {
        kind: "emoji",
        ref: "⛵",
      },
    },
    {
      id: "cmp12_lighthouse",
      label: "hải đăng xa",
      glyph: "🗼",
      value: 4,
      contrast_group: "distance",
      ordering: 5,
      category: {
        type: "vị trí xa",
      },
      image: {
        kind: "emoji",
        ref: "🗼",
      },
    },
    {
      id: "cmp12_plane",
      label: "máy bay ở xa",
      glyph: "✈️",
      value: 5,
      contrast_group: "distance",
      ordering: 6,
      category: {
        type: "vị trí xa",
      },
      image: {
        kind: "emoji",
        ref: "✈️",
      },
    },
    {
      id: "cmp12_mountain",
      label: "ngọn núi xa",
      glyph: "🏔️",
      value: 5,
      contrast_group: "distance",
      ordering: 7,
      category: {
        type: "vị trí xa",
      },
      image: {
        kind: "emoji",
        ref: "🏔️",
      },
    },
    {
      id: "cmp12_star",
      label: "ngôi sao ở xa",
      glyph: "⭐",
      value: 5,
      contrast_group: "distance",
      ordering: 8,
      category: {
        type: "vị trí xa",
      },
      image: {
        kind: "emoji",
        ref: "⭐",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "cmp12_cloud",
      target_id: "cmp12_lighthouse",
    },
    {
      type: "contrast",
      source_id: "cmp12_tree",
      target_id: "cmp12_plane",
    },
    {
      type: "contrast",
      source_id: "cmp12_car",
      target_id: "cmp12_mountain",
    },
    {
      type: "contrast",
      source_id: "cmp12_boat",
      target_id: "cmp12_star",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với xa hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng theo yêu cầu xa hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt theo yêu cầu xa hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so sánh xa hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so sánh xa hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm vật ở xa hơn nhé",
  },
  ordering: [
    "cmp12_cloud",
    "cmp12_tree",
    "cmp12_car",
    "cmp12_boat",
    "cmp12_lighthouse",
    "cmp12_plane",
    "cmp12_mountain",
    "cmp12_star",
  ],
};

export const C1_CMP_12_SEED: SkillSeed = {
  identity: C1_CMP_12_IDENTITY,
  dataset: C1_CMP_12_DATASET,
  levels: [
    {
      code: "GL-C1-VOL-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0049",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
  ],
};
