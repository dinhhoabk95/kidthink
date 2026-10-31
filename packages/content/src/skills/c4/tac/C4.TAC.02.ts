import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TAC_02_IDENTITY: SkillIdentity = {
  code: "C4.TAC.02",
  strand_code: "C4.TAC",
  competency_code: "C4",
  name: "Cứng – mềm",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["compare", "observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.TAC.02-01",
      behaviour: "Nhận biết và thực hành Cứng – mềm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TAC.02-02",
      behaviour: "Vận dụng Cứng – mềm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TAC.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Cứng – mềm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TAC_02_DATASET: SkillDataset = {
  skill_code: "C4.TAC.02",
  concept_label: "Cứng – mềm",
  surface: "game",
  items: [
    {
      id: "teddy",
      label: "gấu bông mềm",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "vật mềm mại",
      },
      value: 1,
      ordering: 1,
      contrast_group: "soft",
      audio_path: "/audio/vi/c4/teddy.mp3",
    },
    {
      id: "pillow",
      label: "đệm ghế êm",
      image: {
        kind: "emoji",
        ref: "🛋️",
      },
      category: {
        type: "vật mềm mại",
      },
      value: 2,
      ordering: 2,
      contrast_group: "soft",
      audio_path: "/audio/vi/c4/pillow.mp3",
    },
    {
      id: "yarn",
      label: "cuộn len mềm",
      image: {
        kind: "emoji",
        ref: "🧶",
      },
      category: {
        type: "vật mềm mại",
      },
      value: 3,
      ordering: 3,
      contrast_group: "soft",
      audio_path: "/audio/vi/c4/yarn.mp3",
    },
    {
      id: "scarf",
      label: "khăn len ấm",
      image: {
        kind: "emoji",
        ref: "🧣",
      },
      category: {
        type: "vật mềm mại",
      },
      value: 4,
      ordering: 4,
      contrast_group: "soft",
      audio_path: "/audio/vi/c4/scarf.mp3",
    },
    {
      id: "brick",
      label: "viên gạch cứng",
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "vật cứng rắn",
      },
      value: 1,
      ordering: 5,
      contrast_group: "hard",
      audio_path: "/audio/vi/c4/brick.mp3",
    },
    {
      id: "stone",
      label: "hòn đá rắn",
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "vật cứng rắn",
      },
      value: 2,
      ordering: 6,
      contrast_group: "hard",
      audio_path: "/audio/vi/c4/stone.mp3",
    },
    {
      id: "iron_pan",
      label: "chảo sắt cứng",
      image: {
        kind: "emoji",
        ref: "🍳",
      },
      category: {
        type: "vật cứng rắn",
      },
      value: 3,
      ordering: 7,
      contrast_group: "hard",
      audio_path: "/audio/vi/c4/iron_pan.mp3",
    },
    {
      id: "wood_block",
      label: "khúc gỗ cứng",
      image: {
        kind: "emoji",
        ref: "🪵",
      },
      category: {
        type: "vật cứng rắn",
      },
      value: 4,
      ordering: 8,
      contrast_group: "hard",
      audio_path: "/audio/vi/c4/wood_block.mp3",
    },
  ],
  axes: {
    category: {
      values: ["vật mềm mại", "vật cứng rắn"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "teddy",
      target_id: "brick",
    },
    {
      type: "contrast",
      source_id: "pillow",
      target_id: "stone",
    },
    {
      type: "contrast",
      source_id: "yarn",
      target_id: "iron_pan",
    },
    {
      type: "contrast",
      source_id: "scarf",
      target_id: "wood_block",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Cứng – mềm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Cứng – mềm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Cứng – mềm nhé",
  },
  ordering: [
    "teddy",
    "pillow",
    "yarn",
    "scarf",
    "brick",
    "stone",
    "iron_pan",
    "wood_block",
  ],
};

export const C4_TAC_02_SEED: SkillSeed = {
  identity: C4_TAC_02_IDENTITY,
  dataset: C4_TAC_02_DATASET,
  levels: [
    {
      code: "GL-C4-TAC-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
  ],
};
