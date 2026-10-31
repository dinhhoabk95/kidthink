import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_LIS_01_IDENTITY: SkillIdentity = {
  code: "C5.LIS.01",
  strand_code: "C5.LIS",
  competency_code: "C5",
  name: "Nghe và chọn",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["listen", "match"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.LIS.01-01",
      behaviour: "Nhận biết và thực hành Nghe và chọn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.LIS.01-02",
      behaviour: "Vận dụng Nghe và chọn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.LIS.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nghe và chọn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_LIS_01_DATASET: SkillDataset = {
  skill_code: "C5.LIS.01",
  concept_label: "Nghe và chọn",
  surface: "game",
  items: [
    {
      id: "lis_mua_roi",
      label: "tiếng mưa rơi",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "âm thanh thiên nhiên",
        label: "Âm thanh thiên nhiên",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/lis/tieng_mua_roi.mp3",
    },
    {
      id: "lis_gio_thoi",
      label: "tiếng gió thổi",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "âm thanh thiên nhiên",
        label: "Âm thanh thiên nhiên",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/lis/tieng_gio_thoi.mp3",
    },
    {
      id: "lis_song_bien",
      label: "tiếng sóng biển",
      image: {
        kind: "emoji",
        ref: "🌊",
      },
      category: {
        type: "âm thanh thiên nhiên",
        label: "Âm thanh thiên nhiên",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/lis/tieng_song_bien.mp3",
    },
    {
      id: "lis_chim_hot",
      label: "tiếng chim hót",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "tiếng kêu động vật",
        label: "Tiếng kêu động vật",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/lis/tieng_chim_hot.mp3",
    },
    {
      id: "lis_meo_keu",
      label: "tiếng mèo kêu",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "tiếng kêu động vật",
        label: "Tiếng kêu động vật",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/lis/tieng_meo_keu.mp3",
    },
    {
      id: "lis_cho_sua",
      label: "tiếng chó sủa",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "tiếng kêu động vật",
        label: "Tiếng kêu động vật",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/lis/tieng_cho_sua.mp3",
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "lis_mua_roi",
      target_id: "lis_gio_thoi",
      explanation: "cùng là âm thanh thiên nhiên",
    },
    {
      type: "pair",
      source_id: "lis_chim_hot",
      target_id: "lis_meo_keu",
      explanation: "cùng là tiếng kêu động vật",
    },
    {
      type: "contrast",
      source_id: "lis_mua_roi",
      target_id: "lis_chim_hot",
      explanation: "âm thanh thiên nhiên đối lập với tiếng kêu động vật",
    },
    {
      type: "contrast",
      source_id: "lis_gio_thoi",
      target_id: "lis_meo_keu",
      explanation: "âm thanh thiên nhiên đối lập với tiếng kêu động vật",
    },
    {
      type: "contrast",
      source_id: "lis_song_bien",
      target_id: "lis_cho_sua",
      explanation: "âm thanh thiên nhiên đối lập với tiếng kêu động vật",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe và chọn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe và chọn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nghe và chọn nhé",
  },
  ordering: [
    "lis_mua_roi",
    "lis_gio_thoi",
    "lis_song_bien",
    "lis_chim_hot",
    "lis_meo_keu",
    "lis_cho_sua",
  ],
};

export const C5_LIS_01_SEED: SkillSeed = {
  identity: C5_LIS_01_IDENTITY,
  dataset: C5_LIS_01_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C5-LIS-AUDIO-0022",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
