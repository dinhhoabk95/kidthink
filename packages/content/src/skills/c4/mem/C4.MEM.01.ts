import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MEM_01_IDENTITY: SkillIdentity = {
  code: "C4.MEM.01",
  strand_code: "C4.MEM",
  competency_code: "C4",
  name: "Lật thẻ tìm cặp",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["recall", "match"],
  tier: "basic",
  prerequisites: ["C3.ANA.01"],
  learning_objectives: [
    {
      code: "LO-C4.MEM.01-01",
      behaviour: "Nhận biết và thực hành Memory Card — tìm cặp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MEM.01-02",
      behaviour: "Vận dụng Memory Card — tìm cặp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MEM.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Memory Card — tìm cặp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MEM_01_DATASET: SkillDataset = {
  skill_code: "C4.MEM.01",
  concept_label: "Lật thẻ tìm cặp",
  surface: "game",
  items: [
    {
      id: "ball",
      label: "quả bóng nhựa",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "món đồ chơi",
      },
      value: 1,
      ordering: 1,
      contrast_group: "toy",
      audio_path: "/audio/vi/c4/ball.mp3",
    },
    {
      id: "teddy",
      label: "chú gấu bông",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "món đồ chơi",
      },
      value: 2,
      ordering: 2,
      contrast_group: "toy",
      audio_path: "/audio/vi/c4/teddy.mp3",
    },
    {
      id: "car",
      label: "xe ô tô",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "món đồ chơi",
      },
      value: 3,
      ordering: 3,
      contrast_group: "toy",
      audio_path: "/audio/vi/c4/car.mp3",
    },
    {
      id: "kite",
      label: "cánh diều",
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      category: {
        type: "món đồ chơi",
      },
      value: 4,
      ordering: 4,
      contrast_group: "toy",
      audio_path: "/audio/vi/c4/kite.mp3",
    },
    {
      id: "crayons",
      label: "bút sáp màu",
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
      category: {
        type: "dụng cụ học",
      },
      value: 1,
      ordering: 5,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/crayons.mp3",
    },
    {
      id: "book",
      label: "quyển truyện tranh",
      image: {
        kind: "emoji",
        ref: "📖",
      },
      category: {
        type: "dụng cụ học",
      },
      value: 2,
      ordering: 6,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/book.mp3",
    },
    {
      id: "scissors",
      label: "cái kéo nhỏ",
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "dụng cụ học",
      },
      value: 3,
      ordering: 7,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/scissors.mp3",
    },
    {
      id: "palette",
      label: "bảng pha màu",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "dụng cụ học",
      },
      value: 4,
      ordering: 8,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/palette.mp3",
    },
  ],
  axes: {
    category: {
      values: ["món đồ chơi", "dụng cụ học"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "ball",
      target_id: "crayons",
    },
    {
      type: "contrast",
      source_id: "teddy",
      target_id: "book",
    },
    {
      type: "contrast",
      source_id: "car",
      target_id: "scissors",
    },
    {
      type: "contrast",
      source_id: "kite",
      target_id: "palette",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với lật thẻ tìm cặp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng lật thẻ tìm cặp",
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
    narration_template: "Chúng mình cùng tìm hiểu về lật thẻ tìm cặp nhé",
  },
  ordering: [
    "ball",
    "teddy",
    "car",
    "kite",
    "crayons",
    "book",
    "scissors",
    "palette",
  ],
};

export const C4_MEM_01_SEED: SkillSeed = {
  identity: C4_MEM_01_IDENTITY,
  dataset: C4_MEM_01_DATASET,
  levels: [
    {
      code: "GL-C4-TAP-INS-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-TAP-INS-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-TAP-INS-0003",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C4-MEM-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
