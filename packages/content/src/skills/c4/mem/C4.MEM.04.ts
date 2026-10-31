import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MEM_04_IDENTITY: SkillIdentity = {
  code: "C4.MEM.04",
  strand_code: "C4.MEM",
  competency_code: "C4",
  name: "Nhớ chuỗi âm thanh",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["recall", "listen"],
  tier: "advanced",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.MEM.04-01",
      behaviour: "Nhận biết và thực hành Nhớ chuỗi âm thanh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MEM.04-02",
      behaviour: "Vận dụng Nhớ chuỗi âm thanh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MEM.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhớ chuỗi âm thanh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MEM_04_DATASET: SkillDataset = {
  skill_code: "C4.MEM.04",
  concept_label: "Nhớ chuỗi âm thanh",
  surface: "game",
  items: [
    {
      id: "sparrow",
      label: "tiếng chim hót",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "tiếng chim muông",
      },
      value: 1,
      ordering: 1,
      contrast_group: "bird",
      audio_path: "/audio/vi/c4/sparrow.mp3",
    },
    {
      id: "rooster",
      label: "tiếng gà gáy",
      image: {
        kind: "emoji",
        ref: "🐓",
      },
      category: {
        type: "tiếng chim muông",
      },
      value: 2,
      ordering: 2,
      contrast_group: "bird",
      audio_path: "/audio/vi/c4/rooster.mp3",
    },
    {
      id: "duck",
      label: "tiếng vịt kêu",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "tiếng chim muông",
      },
      value: 3,
      ordering: 3,
      contrast_group: "bird",
      audio_path: "/audio/vi/c4/duck.mp3",
    },
    {
      id: "owl",
      label: "tiếng chim cú",
      image: {
        kind: "emoji",
        ref: "🦉",
      },
      category: {
        type: "tiếng chim muông",
      },
      value: 4,
      ordering: 4,
      contrast_group: "bird",
      audio_path: "/audio/vi/c4/owl.mp3",
    },
    {
      id: "violin",
      label: "tiếng đàn vĩ",
      image: {
        kind: "emoji",
        ref: "🎻",
      },
      category: {
        type: "tiếng nhạc cụ",
      },
      value: 1,
      ordering: 5,
      contrast_group: "instrument",
      audio_path: "/audio/vi/c4/violin.mp3",
    },
    {
      id: "drum",
      label: "tiếng trống vang",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "tiếng nhạc cụ",
      },
      value: 2,
      ordering: 6,
      contrast_group: "instrument",
      audio_path: "/audio/vi/c4/drum.mp3",
    },
    {
      id: "trumpet",
      label: "tiếng kèn tây",
      image: {
        kind: "emoji",
        ref: "🎺",
      },
      category: {
        type: "tiếng nhạc cụ",
      },
      value: 3,
      ordering: 7,
      contrast_group: "instrument",
      audio_path: "/audio/vi/c4/trumpet.mp3",
    },
    {
      id: "guitar",
      label: "tiếng đàn gảy",
      image: {
        kind: "emoji",
        ref: "🎸",
      },
      category: {
        type: "tiếng nhạc cụ",
      },
      value: 4,
      ordering: 8,
      contrast_group: "instrument",
      audio_path: "/audio/vi/c4/guitar.mp3",
    },
  ],
  axes: {
    category: {
      values: ["tiếng chim muông", "tiếng nhạc cụ"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "sparrow",
      target_id: "violin",
    },
    {
      type: "contrast",
      source_id: "rooster",
      target_id: "drum",
    },
    {
      type: "contrast",
      source_id: "duck",
      target_id: "trumpet",
    },
    {
      type: "contrast",
      source_id: "owl",
      target_id: "guitar",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhớ chuỗi âm thanh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ chuỗi âm thanh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhớ chuỗi âm thanh nhé",
  },
  ordering: [
    "sparrow",
    "rooster",
    "duck",
    "owl",
    "violin",
    "drum",
    "trumpet",
    "guitar",
  ],
};

export const C4_MEM_04_SEED: SkillSeed = {
  identity: C4_MEM_04_IDENTITY,
  dataset: C4_MEM_04_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C4-MEM-BEAT-0001",
      template: "GT-034",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-MEM-BEAT-0002",
      template: "GT-034",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-MEM-SPOT-0002",
      template: "GT-025",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      template: "GT-005",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
    {
      template: "GT-032",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
  ],
};
