import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SEN_02_IDENTITY: SkillIdentity = {
  code: "C4.SEN.02",
  strand_code: "C4.SEN",
  competency_code: "C4",
  name: "Phân biệt hình gần giống",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["compare", "observe"],
  tier: "core",
  prerequisites: ["C4.DET.02"],
  learning_objectives: [
    {
      code: "LO-C4.SEN.02-01",
      behaviour: "Nhận biết và thực hành Phân biệt hình gần giống ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SEN.02-02",
      behaviour: "Vận dụng Phân biệt hình gần giống trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SEN.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Phân biệt hình gần giống",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SEN_02_DATASET: SkillDataset = {
  skill_code: "C4.SEN.02",
  concept_label: "Phân biệt hình gần giống",
  surface: "game",
  items: [
    {
      id: "ball",
      label: "quả bóng tròn",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "hình cong tròn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "curve",
      audio_path: "/audio/vi/c4/ball.mp3",
    },
    {
      id: "clock",
      label: "mặt đồng hồ",
      image: {
        kind: "emoji",
        ref: "⏰",
      },
      category: {
        type: "hình cong tròn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "curve",
      audio_path: "/audio/vi/c4/clock.mp3",
    },
    {
      id: "plate",
      label: "chiếc đĩa tròn",
      image: {
        kind: "emoji",
        ref: "🍽️",
      },
      category: {
        type: "hình cong tròn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "curve",
      audio_path: "/audio/vi/c4/plate.mp3",
    },
    {
      id: "orange",
      label: "quả cam tròn",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "hình cong tròn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "curve",
      audio_path: "/audio/vi/c4/orange.mp3",
    },
    {
      id: "book",
      label: "quyển sách nhỏ",
      image: {
        kind: "emoji",
        ref: "📖",
      },
      category: {
        type: "hình góc cạnh",
      },
      value: 1,
      ordering: 5,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/book.mp3",
    },
    {
      id: "gift_box",
      label: "hộp quà vuông",
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "hình góc cạnh",
      },
      value: 2,
      ordering: 6,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/gift_box.mp3",
    },
    {
      id: "picture_frame",
      label: "khung tranh vuông",
      image: {
        kind: "emoji",
        ref: "🖼️",
      },
      category: {
        type: "hình góc cạnh",
      },
      value: 3,
      ordering: 7,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/picture_frame.mp3",
    },
    {
      id: "wood_block",
      label: "khối gỗ vuông",
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "hình góc cạnh",
      },
      value: 4,
      ordering: 8,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/wood_block.mp3",
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
      source_id: "ball",
      target_id: "gift_box",
    },
    {
      type: "contrast",
      source_id: "clock",
      target_id: "picture_frame",
    },
    {
      type: "contrast",
      source_id: "plate",
      target_id: "wood_block",
    },
    {
      type: "contrast",
      source_id: "orange",
      target_id: "book",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Phân biệt hình gần giống",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Phân biệt hình gần giống",
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
      "Chúng mình cùng tìm hiểu về Phân biệt hình gần giống nhé",
  },
  ordering: [
    "ball",
    "clock",
    "plate",
    "orange",
    "book",
    "gift_box",
    "picture_frame",
    "wood_block",
  ],
};

export const C4_SEN_02_SEED: SkillSeed = {
  identity: C4_SEN_02_IDENTITY,
  dataset: C4_SEN_02_DATASET,
  levels: [
    {
      code: "GL-C4-SEN-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C4-SEN-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
