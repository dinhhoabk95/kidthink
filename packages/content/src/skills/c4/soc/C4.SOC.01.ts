import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SOC_01_IDENTITY: SkillIdentity = {
  code: "C4.SOC.01",
  strand_code: "C4.SOC",
  competency_code: "C4",
  name: "Tên · tuổi · sở thích của mình",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["recall", "describe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.SOC.01-01",
      behaviour:
        "Nhận biết và thực hành Tên · tuổi · sở thích của mình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SOC.01-02",
      behaviour:
        "Vận dụng Tên · tuổi · sở thích của mình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SOC.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tên · tuổi · sở thích của mình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SOC_01_DATASET: SkillDataset = {
  skill_code: "C4.SOC.01",
  concept_label: "Tên · tuổi · sở thích của mình",
  surface: "game",
  items: [
    {
      id: "soccer",
      label: "quả bóng đá",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "môn thể thao",
      },
      value: 1,
      ordering: 1,
      contrast_group: "sport",
      audio_path: "/audio/vi/c4/soccer.mp3",
    },
    {
      id: "cycling",
      label: "chiếc xe đạp",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "môn thể thao",
      },
      value: 2,
      ordering: 2,
      contrast_group: "sport",
      audio_path: "/audio/vi/c4/cycling.mp3",
    },
    {
      id: "swimming",
      label: "bạn bơi lội",
      image: {
        kind: "emoji",
        ref: "🏊",
      },
      category: {
        type: "môn thể thao",
      },
      value: 3,
      ordering: 3,
      contrast_group: "sport",
      audio_path: "/audio/vi/c4/swimming.mp3",
    },
    {
      id: "running",
      label: "bạn chạy bộ",
      image: {
        kind: "emoji",
        ref: "🏃",
      },
      category: {
        type: "môn thể thao",
      },
      value: 4,
      ordering: 4,
      contrast_group: "sport",
      audio_path: "/audio/vi/c4/running.mp3",
    },
    {
      id: "painting",
      label: "bảng vẽ màu",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "môn nghệ thuật",
      },
      value: 1,
      ordering: 5,
      contrast_group: "art",
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
        type: "môn nghệ thuật",
      },
      value: 2,
      ordering: 6,
      contrast_group: "art",
      audio_path: "/audio/vi/c4/reading.mp3",
    },
    {
      id: "piano",
      label: "chiếc đàn phím",
      image: {
        kind: "emoji",
        ref: "🎹",
      },
      category: {
        type: "môn nghệ thuật",
      },
      value: 3,
      ordering: 7,
      contrast_group: "art",
      audio_path: "/audio/vi/c4/piano.mp3",
    },
    {
      id: "singing",
      label: "chiếc mi-crô",
      image: {
        kind: "emoji",
        ref: "🎤",
      },
      category: {
        type: "môn nghệ thuật",
      },
      value: 4,
      ordering: 8,
      contrast_group: "art",
      audio_path: "/audio/vi/c4/singing.mp3",
    },
  ],
  axes: {
    category: {
      values: ["môn thể thao", "môn nghệ thuật"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "soccer",
      target_id: "painting",
    },
    {
      type: "contrast",
      source_id: "cycling",
      target_id: "reading",
    },
    {
      type: "contrast",
      source_id: "swimming",
      target_id: "piano",
    },
    {
      type: "contrast",
      source_id: "running",
      target_id: "singing",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tên · tuổi · sở thích của mình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tên · tuổi · sở thích của mình",
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
      "Chúng mình cùng tìm hiểu về Tên · tuổi · sở thích của mình nhé",
  },
  ordering: [
    "soccer",
    "cycling",
    "swimming",
    "running",
    "painting",
    "reading",
    "piano",
    "singing",
  ],
};

export const C4_SOC_01_SEED: SkillSeed = {
  identity: C4_SOC_01_IDENTITY,
  dataset: C4_SOC_01_DATASET,
  levels: [
    {
      code: "GL-C4-SOC-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-SOC-GRID-0002",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
