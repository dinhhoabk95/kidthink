import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PER_03_IDENTITY: SkillIdentity = {
  code: "C6.PER.03",
  strand_code: "C6.PER",
  competency_code: "C6",
  name: "Làm xong rồi mới chơi tiếp",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["inhibit", "plan"],
  tier: "core",
  prerequisites: ["C6.PER.01"],
  learning_objectives: [
    {
      code: "LO-C6.PER.03-01",
      behaviour:
        "Nhận biết và thực hành Làm xong rồi mới chơi tiếp ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PER.03-02",
      behaviour:
        "Vận dụng Làm xong rồi mới chơi tiếp trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PER.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Làm xong rồi mới chơi tiếp",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PER_03_DATASET: SkillDataset = {
  skill_code: "C6.PER.03",
  concept_label: "Làm xong rồi mới chơi tiếp",
  surface: "game",
  items: [
    {
      id: "notebook",
      label: "viết bài vở",
      image: {
        kind: "emoji",
        ref: "📓",
      },
      category: {
        type: "việc làm trước",
        color: "blue",
        shape: "square",
      },
      value: 1,
      ordering: 1,
      contrast_group: "go",
    },
    {
      id: "book",
      label: "đọc trang sách",
      image: {
        kind: "emoji",
        ref: "📖",
      },
      category: {
        type: "việc làm trước",
        color: "yellow",
        shape: "square",
      },
      value: 2,
      ordering: 2,
      contrast_group: "go",
    },
    {
      id: "backpack",
      label: "cất cặp sách",
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "việc làm trước",
        color: "red",
        shape: "circle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "go",
    },
    {
      id: "basket",
      label: "dọn gọn đồ",
      image: {
        kind: "emoji",
        ref: "🧺",
      },
      category: {
        type: "việc làm trước",
        color: "yellow",
        shape: "circle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "go",
    },
    {
      id: "teddy",
      label: "chơi gấu bông",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "trò chơi sau",
        color: "yellow",
        shape: "circle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "nogo",
    },
    {
      id: "ball",
      label: "đá bóng tròn",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "trò chơi sau",
        color: "white",
        shape: "circle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "nogo",
    },
    {
      id: "kite",
      label: "thả diều bay",
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      category: {
        type: "trò chơi sau",
        color: "blue",
        shape: "triangle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "nogo",
    },
    {
      id: "bicycle",
      label: "đạp xe chơi",
      image: {
        kind: "emoji",
        ref: "🚲",
      },
      category: {
        type: "trò chơi sau",
        color: "green",
        shape: "circle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "nogo",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Làm xong rồi mới chơi tiếp",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Làm xong rồi mới chơi tiếp",
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
    narration_template: "Chúng mình cùng làm xong việc rồi mới chơi nhé",
  },
  axes: {
    type: ["việc làm trước", "trò chơi sau"],
    priority: {
      values: ["làm nhiệm vụ", "kiểm tra", "dọn dẹp", "chơi đùa"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "notebook",
      target_id: "book",
      type: "sequence",
    },
    {
      source_id: "book",
      target_id: "backpack",
      type: "sequence",
    },
    {
      source_id: "backpack",
      target_id: "basket",
      type: "sequence",
    },
    {
      source_id: "basket",
      target_id: "teddy",
      type: "sequence",
    },
  ],
  ordering: [
    "notebook",
    "book",
    "backpack",
    "basket",
    "teddy",
    "ball",
    "kite",
    "bicycle",
  ],
};

export const C6_PER_03_SEED: SkillSeed = {
  identity: C6_PER_03_IDENTITY,
  dataset: C6_PER_03_DATASET,
  levels: [
    {
      code: "GL-C6-PER-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-HUNT-0011",
      template: "GT-037",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      template: "GT-026",
      band: "5-6",
      difficulty: 4,
      theme: "weather",
    },
  ],
};
