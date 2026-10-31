import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_15_IDENTITY: SkillIdentity = {
  code: "C1.CMP.15",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Chậm hơn",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.15-01",
      behaviour: "Nhận biết và thực hành Chậm hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.15-02",
      behaviour: "Vận dụng Chậm hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.15-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chậm hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_15_DATASET: SkillDataset = {
  skill_code: "C1.CMP.15",
  concept_label: "Chậm hơn",
  surface: "game",
  items: [
    {
      id: "cmp15_turtle",
      label: "con rùa chậm",
      glyph: "🐢",
      value: 1,
      contrast_group: "speed",
      ordering: 1,
      category: {
        type: "chuyển động chậm",
      },
      image: {
        kind: "emoji",
        ref: "🐢",
      },
    },
    {
      id: "cmp15_snail",
      label: "ốc sên chậm",
      glyph: "🐌",
      value: 1,
      contrast_group: "speed",
      ordering: 2,
      category: {
        type: "chuyển động chậm",
      },
      image: {
        kind: "emoji",
        ref: "🐌",
      },
    },
    {
      id: "cmp15_bike",
      label: "xe đạp đi chậm",
      glyph: "🚲",
      value: 2,
      contrast_group: "speed",
      ordering: 3,
      category: {
        type: "chuyển động chậm",
      },
      image: {
        kind: "emoji",
        ref: "🚲",
      },
    },
    {
      id: "cmp15_boat",
      label: "thuyền chèo chậm",
      glyph: "🛶",
      value: 2,
      contrast_group: "speed",
      ordering: 4,
      category: {
        type: "chuyển động chậm",
      },
      image: {
        kind: "emoji",
        ref: "🛶",
      },
    },
    {
      id: "cmp15_train",
      label: "tàu hoả nhanh",
      glyph: "🚂",
      value: 4,
      contrast_group: "speed",
      ordering: 5,
      category: {
        type: "chuyển động nhanh",
      },
      image: {
        kind: "emoji",
        ref: "🚂",
      },
    },
    {
      id: "cmp15_plane",
      label: "máy bay nhanh",
      glyph: "✈️",
      value: 5,
      contrast_group: "speed",
      ordering: 6,
      category: {
        type: "chuyển động nhanh",
      },
      image: {
        kind: "emoji",
        ref: "✈️",
      },
    },
    {
      id: "cmp15_cheetah",
      label: "báo hoa nhanh",
      glyph: "🐆",
      value: 5,
      contrast_group: "speed",
      ordering: 7,
      category: {
        type: "chuyển động nhanh",
      },
      image: {
        kind: "emoji",
        ref: "🐆",
      },
    },
    {
      id: "cmp15_rabbit",
      label: "thỏ chạy nhanh",
      glyph: "🐇",
      value: 5,
      contrast_group: "speed",
      ordering: 8,
      category: {
        type: "chuyển động nhanh",
      },
      image: {
        kind: "emoji",
        ref: "🐇",
      },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "cmp15_turtle",
      target_id: "cmp15_train",
    },
    {
      type: "contrast",
      source_id: "cmp15_snail",
      target_id: "cmp15_plane",
    },
    {
      type: "contrast",
      source_id: "cmp15_bike",
      target_id: "cmp15_cheetah",
    },
    {
      type: "contrast",
      source_id: "cmp15_boat",
      target_id: "cmp15_rabbit",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với chậm hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng theo yêu cầu chậm hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt theo yêu cầu chậm hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so sánh chậm hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so sánh chậm hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm vật chuyển động chậm hơn nhé",
  },
  ordering: [
    "cmp15_turtle",
    "cmp15_snail",
    "cmp15_bike",
    "cmp15_boat",
    "cmp15_train",
    "cmp15_plane",
    "cmp15_cheetah",
    "cmp15_rabbit",
  ],
};

export const C1_CMP_15_SEED: SkillSeed = {
  identity: C1_CMP_15_IDENTITY,
  dataset: C1_CMP_15_DATASET,
  levels: [
    {
      code: "GL-C1-HGT-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0059",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0021",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
  ],
};
