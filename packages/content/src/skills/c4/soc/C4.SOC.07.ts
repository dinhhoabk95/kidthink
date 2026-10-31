import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SOC_07_IDENTITY: SkillIdentity = {
  code: "C4.SOC.07",
  strand_code: "C4.SOC",
  competency_code: "C4",
  name: "Bạn khác mình ở điểm nào",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["compare", "describe"],
  tier: "advanced",
  prerequisites: ["C4.SOC.01", "C4.SEN.02"],
  learning_objectives: [
    {
      code: "LO-C4.SOC.07-01",
      behaviour: "Nhận biết và thực hành Bạn khác mình ở điểm nào ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SOC.07-02",
      behaviour: "Vận dụng Bạn khác mình ở điểm nào trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SOC.07-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Bạn khác mình ở điểm nào",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SOC_07_DATASET: SkillDataset = {
  skill_code: "C4.SOC.07",
  concept_label: "Bạn khác mình ở điểm nào",
  surface: "game",
  items: [
    {
      id: "boy_hair",
      label: "bạn tóc ngắn",
      image: {
        kind: "emoji",
        ref: "👦",
      },
      category: {
        type: "đặc điểm bạn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "appearance",
      audio_path: "/audio/vi/c4/boy_hair.mp3",
    },
    {
      id: "girl_hair",
      label: "bạn tóc dài",
      image: {
        kind: "emoji",
        ref: "👧",
      },
      category: {
        type: "đặc điểm bạn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "appearance",
      audio_path: "/audio/vi/c4/girl_hair.mp3",
    },
    {
      id: "curly_hair",
      label: "bạn tóc xoăn",
      image: {
        kind: "emoji",
        ref: "🧒",
      },
      category: {
        type: "đặc điểm bạn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "appearance",
      audio_path: "/audio/vi/c4/curly_hair.mp3",
    },
    {
      id: "glasses",
      label: "bạn đeo kính",
      image: {
        kind: "emoji",
        ref: "👓",
      },
      category: {
        type: "đặc điểm bạn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "appearance",
      audio_path: "/audio/vi/c4/glasses.mp3",
    },
    {
      id: "soccer",
      label: "môn bóng đá",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "sở thích bạn",
      },
      value: 1,
      ordering: 5,
      contrast_group: "hobby",
      audio_path: "/audio/vi/c4/soccer.mp3",
    },
    {
      id: "painting",
      label: "bảng vẽ màu",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "sở thích bạn",
      },
      value: 2,
      ordering: 6,
      contrast_group: "hobby",
      audio_path: "/audio/vi/c4/painting.mp3",
    },
    {
      id: "reading",
      label: "sách truyện tranh",
      image: {
        kind: "emoji",
        ref: "📚",
      },
      category: {
        type: "sở thích bạn",
      },
      value: 3,
      ordering: 7,
      contrast_group: "hobby",
      audio_path: "/audio/vi/c4/reading.mp3",
    },
    {
      id: "music",
      label: "nốt nhạc vui",
      image: {
        kind: "emoji",
        ref: "🎵",
      },
      category: {
        type: "sở thích bạn",
      },
      value: 4,
      ordering: 8,
      contrast_group: "hobby",
      audio_path: "/audio/vi/c4/music.mp3",
    },
  ],
  axes: {
    category: {
      values: ["đặc điểm bạn", "sở thích bạn"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "boy_hair",
      target_id: "soccer",
    },
    {
      type: "contrast",
      source_id: "girl_hair",
      target_id: "painting",
    },
    {
      type: "contrast",
      source_id: "curly_hair",
      target_id: "reading",
    },
    {
      type: "contrast",
      source_id: "glasses",
      target_id: "music",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Bạn khác mình ở điểm nào",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Bạn khác mình ở điểm nào",
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
      "Chúng mình cùng tìm hiểu về Bạn khác mình ở điểm nào nhé",
  },
  ordering: [
    "boy_hair",
    "girl_hair",
    "curly_hair",
    "glasses",
    "soccer",
    "painting",
    "reading",
    "music",
  ],
};

export const C4_SOC_07_SEED: SkillSeed = {
  identity: C4_SOC_07_IDENTITY,
  dataset: C4_SOC_07_DATASET,
  levels: [
    {
      code: "GL-C4-SOC-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
  ],
};
