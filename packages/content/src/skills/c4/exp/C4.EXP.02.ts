import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_EXP_02_IDENTITY: SkillIdentity = {
  code: "C4.EXP.02",
  strand_code: "C4.EXP",
  competency_code: "C4",
  name: "Chìm – nổi",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["predict", "verify"],
  tier: "core",
  prerequisites: ["C4.EXP.01"],
  learning_objectives: [
    {
      code: "LO-C4.EXP.02-01",
      behaviour: "Nhận biết và thực hành Chìm – nổi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.EXP.02-02",
      behaviour: "Vận dụng Chìm – nổi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.EXP.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chìm – nổi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_EXP_02_DATASET: SkillDataset = {
  skill_code: "C4.EXP.02",
  concept_label: "Chìm – nổi",
  surface: "game",
  items: [
    {
      id: "float_duck",
      label: "con vịt nhựa nổi",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "vật nổi lên",
      },
      contrast_group: "float",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/float_duck.mp3",
    },
    {
      id: "float_boat",
      label: "thuyền gỗ nổi",
      image: {
        kind: "emoji",
        ref: "⛵",
      },
      category: {
        type: "vật nổi lên",
      },
      contrast_group: "float",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/float_boat.mp3",
    },
    {
      id: "float_leaf",
      label: "chiếc lá nổi",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "vật nổi lên",
      },
      contrast_group: "float",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/float_leaf.mp3",
    },
    {
      id: "float_ball",
      label: "quả bóng nổi",
      image: {
        kind: "emoji",
        ref: "🏐",
      },
      category: {
        type: "vật nổi lên",
      },
      contrast_group: "float",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/float_ball.mp3",
    },
    {
      id: "sink_rock",
      label: "viên đá chìm",
      image: {
        kind: "emoji",
        ref: "🪨",
      },
      category: {
        type: "vật chìm xuống",
      },
      contrast_group: "sink",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/sink_rock.mp3",
    },
    {
      id: "sink_key",
      label: "chìa khóa sắt chìm",
      image: {
        kind: "emoji",
        ref: "🔑",
      },
      category: {
        type: "vật chìm xuống",
      },
      contrast_group: "sink",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/sink_key.mp3",
    },
    {
      id: "sink_hammer",
      label: "cái búa sắt chìm",
      image: {
        kind: "emoji",
        ref: "🔨",
      },
      category: {
        type: "vật chìm xuống",
      },
      contrast_group: "sink",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/sink_hammer.mp3",
    },
    {
      id: "sink_coin",
      label: "đồng xu kim loại",
      image: {
        kind: "emoji",
        ref: "🪙",
      },
      category: {
        type: "vật chìm xuống",
      },
      contrast_group: "sink",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/sink_coin.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "float_duck",
      target_id: "sink_rock",
    },
    {
      type: "contrast",
      source_id: "float_boat",
      target_id: "sink_key",
    },
    {
      type: "contrast",
      source_id: "float_leaf",
      target_id: "sink_hammer",
    },
    {
      type: "contrast",
      source_id: "float_ball",
      target_id: "sink_coin",
    },
  ],
  axes: {
    buoyancy: {
      values: ["vật nổi lên", "vật chìm xuống"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chìm – nổi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chìm – nổi",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chìm – nổi nhé",
  },
  ordering: [
    "float_duck",
    "float_boat",
    "float_leaf",
    "float_ball",
    "sink_rock",
    "sink_key",
    "sink_hammer",
    "sink_coin",
  ],
};

export const C4_EXP_02_SEED: SkillSeed = {
  identity: C4_EXP_02_IDENTITY,
  dataset: C4_EXP_02_DATASET,
  levels: [
    {
      code: "GL-C4-EXP-TFRA-0004",
      template: "GT-019",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-TFRA-0005",
      template: "GT-019",
      band: "4-5",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C4-EXP-MEAS-0001",
      template: "GT-028",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
  ],
};
