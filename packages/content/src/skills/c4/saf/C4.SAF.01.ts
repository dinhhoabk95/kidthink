import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SAF_01_IDENTITY: SkillIdentity = {
  code: "C4.SAF.01",
  strand_code: "C4.SAF",
  competency_code: "C4",
  name: "Phương tiện theo đường đi",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sort", "match"],
  tier: "core",
  prerequisites: ["C3.CLS.04"],
  learning_objectives: [
    {
      code: "LO-C4.SAF.01-01",
      behaviour:
        "Nhận biết và thực hành Phương tiện theo đường đi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SAF.01-02",
      behaviour:
        "Vận dụng Phương tiện theo đường đi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SAF.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phương tiện theo đường đi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SAF_01_DATASET: SkillDataset = {
  skill_code: "C4.SAF.01",
  concept_label: "Phương tiện theo đường đi",
  surface: "game",
  items: [
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
      value: 1,
      ordering: 1,
      contrast_group: "land",
      audio_path: "/audio/vi/c4/car.mp3",
    },
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
      value: 2,
      ordering: 2,
      contrast_group: "land",
      audio_path: "/audio/vi/c4/bus.mp3",
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
      id: "sailboat",
      label: "thuyền buồm nhỏ",
      image: {
        kind: "emoji",
        ref: "⛵",
      },
      category: {
        type: "xe đường thủy",
      },
      value: 1,
      ordering: 5,
      contrast_group: "water",
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
        type: "xe đường thủy",
      },
      value: 2,
      ordering: 6,
      contrast_group: "water",
      audio_path: "/audio/vi/c4/ship.mp3",
    },
    {
      id: "boat",
      label: "chiếc thuyền nan",
      image: {
        kind: "emoji",
        ref: "🛶",
      },
      category: {
        type: "xe đường thủy",
      },
      value: 3,
      ordering: 7,
      contrast_group: "water",
      audio_path: "/audio/vi/c4/boat.mp3",
    },
    {
      id: "speedboat",
      label: "chiếc ca-nô",
      image: {
        kind: "emoji",
        ref: "🚤",
      },
      category: {
        type: "xe đường thủy",
      },
      value: 4,
      ordering: 8,
      contrast_group: "water",
      audio_path: "/audio/vi/c4/speedboat.mp3",
    },
  ],
  axes: {
    category: {
      values: ["xe đường bộ", "xe đường thủy"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "car",
      target_id: "sailboat",
    },
    {
      type: "contrast",
      source_id: "bus",
      target_id: "ship",
    },
    {
      type: "contrast",
      source_id: "bicycle",
      target_id: "boat",
    },
    {
      type: "contrast",
      source_id: "train",
      target_id: "speedboat",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Phương tiện theo đường đi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phương tiện theo đường đi",
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
    narration_template:
      "Chúng mình cùng tìm hiểu về Phương tiện theo đường đi nhé",
  },
  ordering: [
    "car",
    "bus",
    "bicycle",
    "train",
    "sailboat",
    "ship",
    "boat",
    "speedboat",
  ],
};

export const C4_SAF_01_SEED: SkillSeed = {
  identity: C4_SAF_01_IDENTITY,
  dataset: C4_SAF_01_DATASET,
  levels: [
    {
      code: "GL-C4-SAF-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
  ],
};
