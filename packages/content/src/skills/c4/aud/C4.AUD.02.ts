import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_AUD_02_IDENTITY: SkillIdentity = {
  code: "C4.AUD.02",
  strand_code: "C4.AUD",
  competency_code: "C4",
  name: "Tiếng con vật",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["listen", "match"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.AUD.02-01",
      behaviour: "Nhận biết và thực hành Tiếng con vật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.AUD.02-02",
      behaviour: "Vận dụng Tiếng con vật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.AUD.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tiếng con vật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_AUD_02_DATASET: SkillDataset = {
  skill_code: "C4.AUD.02",
  concept_label: "Tiếng con vật",
  surface: "game",
  items: [
    {
      id: "aud_dog",
      label: "tiếng chó sủa",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "tiếng con vật",
      },
      contrast_group: "animal",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/aud_dog.mp3",
    },
    {
      id: "aud_cat",
      label: "tiếng mèo kêu",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "tiếng con vật",
      },
      contrast_group: "animal",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/aud_cat.mp3",
    },
    {
      id: "aud_rooster",
      label: "tiếng gà gáy",
      image: {
        kind: "emoji",
        ref: "🐔",
      },
      category: {
        type: "tiếng con vật",
      },
      contrast_group: "animal",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/aud_rooster.mp3",
    },
    {
      id: "aud_duck",
      label: "tiếng vịt kêu",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "tiếng con vật",
      },
      contrast_group: "animal",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/aud_duck.mp3",
    },
    {
      id: "aud_car",
      label: "tiếng còi ô tô",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "tiếng phương tiện",
      },
      contrast_group: "vehicle",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/aud_car.mp3",
    },
    {
      id: "aud_train",
      label: "tiếng tàu hỏa",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "tiếng phương tiện",
      },
      contrast_group: "vehicle",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/aud_train.mp3",
    },
    {
      id: "aud_ambulance",
      label: "tiếng xe cứu thương",
      image: {
        kind: "emoji",
        ref: "🚑",
      },
      category: {
        type: "tiếng phương tiện",
      },
      contrast_group: "vehicle",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/aud_ambulance.mp3",
    },
    {
      id: "aud_airplane",
      label: "tiếng máy bay",
      image: {
        kind: "emoji",
        ref: "✈️",
      },
      category: {
        type: "tiếng phương tiện",
      },
      contrast_group: "vehicle",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/aud_airplane.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "aud_dog",
      target_id: "aud_car",
    },
    {
      type: "contrast",
      source_id: "aud_cat",
      target_id: "aud_train",
    },
    {
      type: "contrast",
      source_id: "aud_rooster",
      target_id: "aud_ambulance",
    },
    {
      type: "contrast",
      source_id: "aud_duck",
      target_id: "aud_airplane",
    },
  ],
  axes: {
    sound_type: {
      values: ["tiếng con vật", "tiếng phương tiện"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tiếng con vật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tiếng con vật",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tiếng con vật nhé",
  },
  ordering: [
    "aud_dog",
    "aud_cat",
    "aud_rooster",
    "aud_duck",
    "aud_car",
    "aud_train",
    "aud_ambulance",
    "aud_airplane",
  ],
};

export const C4_AUD_02_SEED: SkillSeed = {
  identity: C4_AUD_02_IDENTITY,
  dataset: C4_AUD_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C4-AUD-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-PATT-0004",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-AUD-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
  ],
};
