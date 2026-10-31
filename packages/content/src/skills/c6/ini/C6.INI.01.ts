import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INI_01_IDENTITY: SkillIdentity = {
  code: "C6.INI.01",
  strand_code: "C6.INI",
  competency_code: "C6",
  name: "Tự chọn hoạt động",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["plan", "describe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C6.INI.01-01",
      behaviour: "Nhận biết và thực hành Tự chọn hoạt động ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INI.01-02",
      behaviour: "Vận dụng Tự chọn hoạt động trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INI.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tự chọn hoạt động",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INI_01_DATASET: SkillDataset = {
  skill_code: "C6.INI.01",
  concept_label: "Tự chọn hoạt động",
  surface: "game",
  items: [
    {
      id: "paper",
      label: "tờ giấy",
      image: {
        kind: "emoji",
        ref: "📄",
      },
      category: {
        type: "dụng cụ vẽ",
        color: "white",
        shape: "square",
      },
      value: 1,
      ordering: 1,
      contrast_group: "art_tools",
    },
    {
      id: "pencil",
      label: "bút chì",
      image: {
        kind: "emoji",
        ref: "✏️",
      },
      category: {
        type: "dụng cụ vẽ",
        color: "yellow",
        shape: "triangle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "art_tools",
    },
    {
      id: "palette",
      label: "bảng pha màu",
      image: {
        kind: "emoji",
        ref: "🎨",
      },
      category: {
        type: "dụng cụ vẽ",
        color: "blue",
        shape: "circle",
      },
      value: 3,
      ordering: 3,
      contrast_group: "art_tools",
    },
    {
      id: "brush",
      label: "cọ vẽ",
      image: {
        kind: "emoji",
        ref: "🖌️",
      },
      category: {
        type: "dụng cụ vẽ",
        color: "red",
        shape: "triangle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "art_tools",
    },
    {
      id: "blocks",
      label: "khối gỗ",
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "đồ chơi",
        color: "red",
        shape: "square",
      },
      value: 5,
      ordering: 5,
      contrast_group: "play_toys",
    },
    {
      id: "robot",
      label: "người máy",
      image: {
        kind: "emoji",
        ref: "🤖",
      },
      category: {
        type: "đồ chơi",
        color: "blue",
        shape: "square",
      },
      value: 6,
      ordering: 6,
      contrast_group: "play_toys",
    },
    {
      id: "teddy",
      label: "gấu bông",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "đồ chơi",
        color: "yellow",
        shape: "circle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "play_toys",
    },
    {
      id: "car",
      label: "ô tô",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "đồ chơi",
        color: "red",
        shape: "circle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "play_toys",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tự chọn hoạt động",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự chọn hoạt động",
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
    narration_template: "Chúng mình cùng tự chọn hoạt động yêu thích nhé",
  },
  axes: {
    type: ["dụng cụ vẽ", "đồ chơi"],
    step: {
      values: ["bước 1", "bước 2", "bước 3", "bước 4"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "paper",
      target_id: "pencil",
      type: "pair",
    },
    {
      source_id: "palette",
      target_id: "brush",
      type: "pair",
    },
    {
      source_id: "blocks",
      target_id: "robot",
      type: "pair",
    },
    {
      source_id: "teddy",
      target_id: "car",
      type: "pair",
    },
  ],
  ordering: [
    "paper",
    "pencil",
    "palette",
    "brush",
    "blocks",
    "robot",
    "teddy",
    "car",
  ],
};

export const C6_INI_01_SEED: SkillSeed = {
  identity: C6_INI_01_IDENTITY,
  dataset: C6_INI_01_DATASET,
  levels: [
    {
      code: "GL-C6-INI-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C6-INI-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
