import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MEM_02_IDENTITY: SkillIdentity = {
  code: "C4.MEM.02",
  strand_code: "C4.MEM",
  competency_code: "C4",
  name: "Nhớ chuỗi hình",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["recall", "sequence"],
  tier: "core",
  prerequisites: ["C4.DET.02"],
  learning_objectives: [
    {
      code: "LO-C4.MEM.02-01",
      behaviour: "Nhận biết và thực hành Nhớ chuỗi hình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MEM.02-02",
      behaviour: "Vận dụng Nhớ chuỗi hình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MEM.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhớ chuỗi hình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MEM_02_DATASET: SkillDataset = {
  skill_code: "C4.MEM.02",
  concept_label: "Nhớ chuỗi hình",
  surface: "game",
  items: [
    {
      id: "star",
      label: "ngôi sao vàng",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "hình cong tròn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "curve",
      audio_path: "/audio/vi/c4/star.mp3",
    },
    {
      id: "heart",
      label: "trái tim đỏ",
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      category: {
        type: "hình cong tròn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "curve",
      audio_path: "/audio/vi/c4/heart.mp3",
    },
    {
      id: "moon",
      label: "mặt trăng khuyết",
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      category: {
        type: "hình cong tròn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "curve",
      audio_path: "/audio/vi/c4/moon.mp3",
    },
    {
      id: "sun",
      label: "mặt trời tròn",
      image: {
        kind: "emoji",
        ref: "☀️",
      },
      category: {
        type: "hình cong tròn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "curve",
      audio_path: "/audio/vi/c4/sun.mp3",
    },
    {
      id: "square",
      label: "hình vuông xanh",
      image: {
        kind: "emoji",
        ref: "🟩",
      },
      category: {
        type: "hình góc cạnh",
      },
      value: 1,
      ordering: 5,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/square.mp3",
    },
    {
      id: "triangle",
      label: "hình tam giác",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "hình góc cạnh",
      },
      value: 2,
      ordering: 6,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/triangle.mp3",
    },
    {
      id: "rectangle",
      label: "quyển sách nhỏ",
      image: {
        kind: "emoji",
        ref: "📕",
      },
      category: {
        type: "hình góc cạnh",
      },
      value: 3,
      ordering: 7,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/rectangle.mp3",
    },
    {
      id: "diamond",
      label: "hình thoi lam",
      image: {
        kind: "emoji",
        ref: "🔷",
      },
      category: {
        type: "hình góc cạnh",
      },
      value: 4,
      ordering: 8,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/diamond.mp3",
    },
  ],
  axes: {
    category: {
      values: ["hình cong tròn", "hình góc cạnh"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "star",
      target_id: "square",
    },
    {
      type: "contrast",
      source_id: "heart",
      target_id: "triangle",
    },
    {
      type: "contrast",
      source_id: "moon",
      target_id: "rectangle",
    },
    {
      type: "contrast",
      source_id: "sun",
      target_id: "diamond",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhớ chuỗi hình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ chuỗi hình",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhớ chuỗi hình nhé",
  },
  ordering: [
    "star",
    "heart",
    "moon",
    "sun",
    "square",
    "triangle",
    "rectangle",
    "diamond",
  ],
};

export const C4_MEM_02_SEED: SkillSeed = {
  identity: C4_MEM_02_IDENTITY,
  dataset: C4_MEM_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C4-MEM-SEQ-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-MEM-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C4-MEM-SIZE-0002",
      template: "GT-009",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C4-MEM-PUZZ-0001",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-MEM-PUZZ-0002",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-MEM-SPOT-0001",
      template: "GT-025",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
  ],
};
