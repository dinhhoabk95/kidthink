import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_TAC_05_IDENTITY: SkillIdentity = {
  code: "C4.TAC.05",
  strand_code: "C4.TAC",
  competency_code: "C4",
  name: "Đoán vật trong túi bí mật",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["infer", "deduce"],
  tier: "advanced",
  prerequisites: ["C4.TAC.01", "C4.TAC.02"],
  learning_objectives: [
    {
      code: "LO-C4.TAC.05-01",
      behaviour:
        "Nhận biết và thực hành Đoán vật trong túi bí mật ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.TAC.05-02",
      behaviour:
        "Vận dụng Đoán vật trong túi bí mật trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.TAC.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đoán vật trong túi bí mật",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_TAC_05_DATASET: SkillDataset = {
  skill_code: "C4.TAC.05",
  concept_label: "Đoán vật trong túi bí mật",
  surface: "game",
  items: [
    {
      id: "round_ball",
      label: "quả bóng tròn",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "vật hình tròn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "round",
      audio_path: "/audio/vi/c4/round_ball.mp3",
    },
    {
      id: "orange",
      label: "quả cam tròn",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "vật hình tròn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "round",
      audio_path: "/audio/vi/c4/orange.mp3",
    },
    {
      id: "apple",
      label: "quả táo ngọt",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "vật hình tròn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "round",
      audio_path: "/audio/vi/c4/apple.mp3",
    },
    {
      id: "yarn_ball",
      label: "cuộn len mềm",
      image: {
        kind: "emoji",
        ref: "🧶",
      },
      category: {
        type: "vật hình tròn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "round",
      audio_path: "/audio/vi/c4/yarn_ball.mp3",
    },
    {
      id: "wooden_block",
      label: "khối gỗ vuông",
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "vật góc cạnh",
      },
      value: 1,
      ordering: 5,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/wooden_block.mp3",
    },
    {
      id: "pencil_case",
      label: "hộp bút dài",
      image: {
        kind: "emoji",
        ref: "📦",
      },
      category: {
        type: "vật góc cạnh",
      },
      value: 2,
      ordering: 6,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/pencil_case.mp3",
    },
    {
      id: "story_book",
      label: "quyển sách nhỏ",
      image: {
        kind: "emoji",
        ref: "📘",
      },
      category: {
        type: "vật góc cạnh",
      },
      value: 3,
      ordering: 7,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/story_book.mp3",
    },
    {
      id: "ruler",
      label: "chiếc thước dài",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "vật góc cạnh",
      },
      value: 4,
      ordering: 8,
      contrast_group: "angular",
      audio_path: "/audio/vi/c4/ruler.mp3",
    },
  ],
  axes: {
    category: {
      values: ["vật hình tròn", "vật góc cạnh"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "round_ball",
      target_id: "wooden_block",
    },
    {
      type: "contrast",
      source_id: "orange",
      target_id: "pencil_case",
    },
    {
      type: "contrast",
      source_id: "apple",
      target_id: "story_book",
    },
    {
      type: "contrast",
      source_id: "yarn_ball",
      target_id: "ruler",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đoán vật trong túi bí mật",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đoán vật trong túi bí mật",
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
      "Chúng mình cùng tìm hiểu về Đoán vật trong túi bí mật nhé",
  },
  ordering: [
    "round_ball",
    "orange",
    "apple",
    "yarn_ball",
    "wooden_block",
    "pencil_case",
    "story_book",
    "ruler",
  ],
};

export const C4_TAC_05_SEED: SkillSeed = {
  identity: C4_TAC_05_IDENTITY,
  dataset: C4_TAC_05_DATASET,
  levels: [
    {
      code: "GL-C4-TAC-PAIR-0005",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-PAIR-0006",
      template: "GT-004",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C4-TAC-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
  ],
};
