import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_14_IDENTITY: SkillIdentity = {
  code: "C1.CMP.14",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Nhanh hơn",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.14-01",
      behaviour: "Nhận biết và thực hành Nhanh hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.14-02",
      behaviour: "Vận dụng Nhanh hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.14-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhanh hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_14_DATASET: SkillDataset = {
  skill_code: "C1.CMP.14",
  concept_label: "Nhanh hơn",
  surface: "game",
  items: [
    {
      id: "cmp14_turtle",
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
      id: "cmp14_snail",
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
      id: "cmp14_bike",
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
      id: "cmp14_boat",
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
      id: "cmp14_train",
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
      id: "cmp14_plane",
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
      id: "cmp14_cheetah",
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
      id: "cmp14_rabbit",
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
      source_id: "cmp14_turtle",
      target_id: "cmp14_train",
    },
    {
      type: "contrast",
      source_id: "cmp14_snail",
      target_id: "cmp14_plane",
    },
    {
      type: "contrast",
      source_id: "cmp14_bike",
      target_id: "cmp14_cheetah",
    },
    {
      type: "contrast",
      source_id: "cmp14_boat",
      target_id: "cmp14_rabbit",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với nhanh hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng theo yêu cầu nhanh hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt theo yêu cầu nhanh hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so sánh nhanh hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so sánh nhanh hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm vật chuyển động nhanh hơn nhé",
  },
  ordering: [
    "cmp14_turtle",
    "cmp14_snail",
    "cmp14_bike",
    "cmp14_boat",
    "cmp14_train",
    "cmp14_plane",
    "cmp14_cheetah",
    "cmp14_rabbit",
  ],
};

export const C1_CMP_14_SEED: SkillSeed = {
  identity: C1_CMP_14_IDENTITY,
  dataset: C1_CMP_14_DATASET,
  levels: [
    {
      code: "GL-C1-HGT-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0055",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TCNT-0019",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
  ],
};
