import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_09_IDENTITY: SkillIdentity = {
  code: "C1.CMP.09",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Thấp hơn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.09-01",
      behaviour: "Nhận biết và thực hành Thấp hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.09-02",
      behaviour: "Vận dụng Thấp hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thấp hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_09_DATASET: SkillDataset = {
  skill_code: "C1.CMP.09",
  concept_label: "Thấp hơn",
  surface: "game",
  items: [
    {
      id: "cmp09_rabbit",
      label: "chú thỏ thấp",
      glyph: "🐰",
      value: 1,
      contrast_group: "height",
      ordering: 1,
      category: {
        type: "vật thấp bé",
      },
      image: {
        kind: "emoji",
        ref: "🐰",
      },
    },
    {
      id: "cmp09_house",
      label: "ngôi nhà thấp",
      glyph: "🏠",
      value: 1,
      contrast_group: "height",
      ordering: 2,
      category: {
        type: "vật thấp bé",
      },
      image: {
        kind: "emoji",
        ref: "🏠",
      },
    },
    {
      id: "cmp09_mushroom",
      label: "cây nấm thấp",
      glyph: "🍄",
      value: 2,
      contrast_group: "height",
      ordering: 3,
      category: {
        type: "vật thấp bé",
      },
      image: {
        kind: "emoji",
        ref: "🍄",
      },
    },
    {
      id: "cmp09_fence",
      label: "hàng rào thấp",
      glyph: "🧱",
      value: 2,
      contrast_group: "height",
      ordering: 4,
      category: {
        type: "vật thấp bé",
      },
      image: {
        kind: "emoji",
        ref: "🧱",
      },
    },
    {
      id: "cmp09_tower",
      label: "ngọn tháp cao",
      glyph: "🗼",
      value: 5,
      contrast_group: "height",
      ordering: 5,
      category: {
        type: "vật cao lớn",
      },
      image: {
        kind: "emoji",
        ref: "🗼",
      },
    },
    {
      id: "cmp09_pine",
      label: "cây thông cao",
      glyph: "🌲",
      value: 5,
      contrast_group: "height",
      ordering: 6,
      category: {
        type: "vật cao lớn",
      },
      image: {
        kind: "emoji",
        ref: "🌲",
      },
    },
    {
      id: "cmp09_building",
      label: "tòa nhà cao",
      glyph: "🏢",
      value: 5,
      contrast_group: "height",
      ordering: 7,
      category: {
        type: "vật cao lớn",
      },
      image: {
        kind: "emoji",
        ref: "🏢",
      },
    },
    {
      id: "cmp09_giraffe",
      label: "hươu cao cổ",
      glyph: "🦒",
      value: 5,
      contrast_group: "height",
      ordering: 8,
      category: {
        type: "vật cao lớn",
      },
      image: {
        kind: "emoji",
        ref: "🦒",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "cmp09_rabbit",
      target_id: "cmp09_tower",
    },
    {
      type: "contrast",
      source_id: "cmp09_house",
      target_id: "cmp09_pine",
    },
    {
      type: "contrast",
      source_id: "cmp09_mushroom",
      target_id: "cmp09_building",
    },
    {
      type: "contrast",
      source_id: "cmp09_fence",
      target_id: "cmp09_giraffe",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với thấp hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng theo yêu cầu thấp hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt theo yêu cầu thấp hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so sánh thấp hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so sánh thấp hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm vật thấp hơn nhé",
  },
  ordering: [
    "cmp09_rabbit",
    "cmp09_house",
    "cmp09_mushroom",
    "cmp09_fence",
    "cmp09_tower",
    "cmp09_pine",
    "cmp09_building",
    "cmp09_giraffe",
  ],
};

export const C1_CMP_09_SEED: SkillSeed = {
  identity: C1_CMP_09_IDENTITY,
  dataset: C1_CMP_09_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-TAP-0037",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0038",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0039",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
    },
  ],
};
