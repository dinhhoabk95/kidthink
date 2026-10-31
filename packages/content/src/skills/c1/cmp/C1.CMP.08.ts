import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_08_IDENTITY: SkillIdentity = {
  code: "C1.CMP.08",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Cao hơn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.08-01",
      behaviour: "Nhận biết và thực hành Cao hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.08-02",
      behaviour: "Vận dụng Cao hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.08-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cao hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_08_DATASET: SkillDataset = {
  skill_code: "C1.CMP.08",
  concept_label: "Cao hơn",
  surface: "game",
  items: [
    {
      id: "cmp08_rabbit",
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
      id: "cmp08_house",
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
      id: "cmp08_mushroom",
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
      id: "cmp08_fence",
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
      id: "cmp08_tower",
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
      id: "cmp08_pine",
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
      id: "cmp08_building",
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
      id: "cmp08_giraffe",
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
      source_id: "cmp08_rabbit",
      target_id: "cmp08_tower",
    },
    {
      type: "contrast",
      source_id: "cmp08_house",
      target_id: "cmp08_pine",
    },
    {
      type: "contrast",
      source_id: "cmp08_mushroom",
      target_id: "cmp08_building",
    },
    {
      type: "contrast",
      source_id: "cmp08_fence",
      target_id: "cmp08_giraffe",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với cao hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng theo yêu cầu cao hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt theo yêu cầu cao hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so sánh cao hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so sánh cao hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm vật cao hơn nhé",
  },
  ordering: [
    "cmp08_rabbit",
    "cmp08_house",
    "cmp08_mushroom",
    "cmp08_fence",
    "cmp08_tower",
    "cmp08_pine",
    "cmp08_building",
    "cmp08_giraffe",
  ],
};

export const C1_CMP_08_SEED: SkillSeed = {
  identity: C1_CMP_08_IDENTITY,
  dataset: C1_CMP_08_DATASET,
  levels: [
    {
      code: "GL-C1-CMP-TAP-0032",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0033",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-PATT-0034",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
  ],
};
