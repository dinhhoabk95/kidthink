import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_OBS_02_IDENTITY: SkillIdentity = {
  code: "C4.OBS.02",
  strand_code: "C4.OBS",
  competency_code: "C4",
  name: "So hai vật cùng loại",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: ["C4.OBS.01", "C4.SEN.02"],
  learning_objectives: [
    {
      code: "LO-C4.OBS.02-01",
      behaviour: "Nhận biết và thực hành So hai vật cùng loại ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.OBS.02-02",
      behaviour: "Vận dụng So hai vật cùng loại trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.OBS.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới So hai vật cùng loại",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_OBS_02_DATASET: SkillDataset = {
  skill_code: "C4.OBS.02",
  concept_label: "So hai vật cùng loại",
  surface: "game",
  items: [
    {
      id: "bus",
      label: "xe buýt lớn",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "xe đường bộ",
      },
      value: 1,
      ordering: 1,
      contrast_group: "land",
      audio_path: "/audio/vi/c4/bus.mp3",
    },
    {
      id: "car",
      label: "xe ô tô con",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "xe đường bộ",
      },
      value: 2,
      ordering: 2,
      contrast_group: "land",
      audio_path: "/audio/vi/c4/car.mp3",
    },
    {
      id: "bicycle",
      label: "chiếc xe đạp",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "xe đường bộ",
      },
      value: 3,
      ordering: 3,
      contrast_group: "land",
      audio_path: "/audio/vi/c4/bicycle.mp3",
    },
    {
      id: "train",
      label: "tàu hỏa dài",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "xe đường bộ",
      },
      value: 4,
      ordering: 4,
      contrast_group: "land",
      audio_path: "/audio/vi/c4/train.mp3",
    },
    {
      id: "airplane",
      label: "chiếc máy bay",
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "xe biển trời",
      },
      value: 1,
      ordering: 5,
      contrast_group: "air_sea",
      audio_path: "/audio/vi/c4/airplane.mp3",
    },
    {
      id: "helicopter",
      label: "trực thăng nhỏ",
      image: {
        kind: "emoji",
        ref: "🚁",
      },
      category: {
        type: "xe biển trời",
      },
      value: 2,
      ordering: 6,
      contrast_group: "air_sea",
      audio_path: "/audio/vi/c4/helicopter.mp3",
    },
    {
      id: "sailboat",
      label: "thuyền buồm nhỏ",
      image: {
        kind: "emoji",
        ref: "⛵",
      },
      category: {
        type: "xe biển trời",
      },
      value: 3,
      ordering: 7,
      contrast_group: "air_sea",
      audio_path: "/audio/vi/c4/sailboat.mp3",
    },
    {
      id: "ship",
      label: "tàu thủy lớn",
      image: {
        kind: "emoji",
        ref: "🚢",
      },
      category: {
        type: "xe biển trời",
      },
      value: 4,
      ordering: 8,
      contrast_group: "air_sea",
      audio_path: "/audio/vi/c4/ship.mp3",
    },
  ],
  axes: {
    category: {
      values: ["xe đường bộ", "xe biển trời"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "bus",
      target_id: "airplane",
    },
    {
      type: "contrast",
      source_id: "car",
      target_id: "helicopter",
    },
    {
      type: "contrast",
      source_id: "bicycle",
      target_id: "sailboat",
    },
    {
      type: "contrast",
      source_id: "train",
      target_id: "ship",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với So hai vật cùng loại",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng So hai vật cùng loại",
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
    narration_template: "Chúng mình cùng tìm hiểu về So hai vật cùng loại nhé",
  },
  ordering: [
    "bus",
    "car",
    "bicycle",
    "train",
    "airplane",
    "helicopter",
    "sailboat",
    "ship",
  ],
};

export const C4_OBS_02_SEED: SkillSeed = {
  identity: C4_OBS_02_IDENTITY,
  dataset: C4_OBS_02_DATASET,
  levels: [
    {
      code: "GL-C4-OBS-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-OBS-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
