import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_VIS_02_IDENTITY: SkillIdentity = {
  code: "C4.VIS.02",
  strand_code: "C4.VIS",
  competency_code: "C4",
  name: "Tìm vật giống nhau trong nhóm",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.VIS.02-01",
      behaviour:
        "Nhận biết và thực hành Tìm vật giống nhau trong nhóm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.VIS.02-02",
      behaviour:
        "Vận dụng Tìm vật giống nhau trong nhóm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.VIS.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Tìm vật giống nhau trong nhóm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_VIS_02_DATASET: SkillDataset = {
  skill_code: "C4.VIS.02",
  concept_label: "Tìm vật giống nhau trong nhóm",
  surface: "game",
  items: [
    {
      id: "ball",
      label: "quả bóng nảy",
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
      label: "xe ô tô con",
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
      id: "blocks",
      label: "khối gỗ xếp",
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "món đồ chơi",
      },
      value: 4,
      ordering: 4,
      contrast_group: "toy",
      audio_path: "/audio/vi/c4/blocks.mp3",
    },
    {
      id: "book",
      label: "quyển truyện tranh",
      image: {
        kind: "emoji",
        ref: "📖",
      },
      category: {
        type: "đồ dùng học",
      },
      value: 1,
      ordering: 5,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/book.mp3",
    },
    {
      id: "crayons",
      label: "bút sáp màu",
      image: {
        kind: "emoji",
        ref: "🖍️",
      },
      category: {
        type: "đồ dùng học",
      },
      value: 2,
      ordering: 6,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/crayons.mp3",
    },
    {
      id: "backpack",
      label: "chiếc cặp sách",
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "đồ dùng học",
      },
      value: 3,
      ordering: 7,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/backpack.mp3",
    },
    {
      id: "scissors",
      label: "cái kéo nhỏ",
      image: {
        kind: "emoji",
        ref: "✂️",
      },
      category: {
        type: "đồ dùng học",
      },
      value: 4,
      ordering: 8,
      contrast_group: "tool",
      audio_path: "/audio/vi/c4/scissors.mp3",
    },
  ],
  axes: {
    category: {
      values: ["món đồ chơi", "đồ dùng học"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "ball",
      target_id: "book",
    },
    {
      type: "contrast",
      source_id: "teddy",
      target_id: "crayons",
    },
    {
      type: "contrast",
      source_id: "car",
      target_id: "backpack",
    },
    {
      type: "contrast",
      source_id: "blocks",
      target_id: "scissors",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tìm vật giống nhau trong nhóm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tìm vật giống nhau trong nhóm",
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
      "Chúng mình cùng tìm hiểu về Tìm vật giống nhau trong nhóm nhé",
  },
  ordering: [
    "ball",
    "teddy",
    "car",
    "blocks",
    "book",
    "crayons",
    "backpack",
    "scissors",
  ],
};

export const C4_VIS_02_SEED: SkillSeed = {
  identity: C4_VIS_02_IDENTITY,
  dataset: C4_VIS_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C4-VIS-CARD-0101",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      montessori_ref: "WB03-D1",
    },
    {
      code: "GL-C4-VIS-CARD-0102",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
      montessori_ref: "WB03-D1",
    },
    {
      code: "GL-C4-VIS-MATCH-0104",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
      montessori_ref: "WB03-D2",
    },
    {
      code: "GL-C4-VIS-MATCH-0105",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
      montessori_ref: "WB03-D2",
    },
    {
      code: "GL-C4-VIS-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C4-VIS-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
  ],
};
