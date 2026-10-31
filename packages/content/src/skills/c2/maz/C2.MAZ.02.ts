import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_MAZ_02_IDENTITY: SkillIdentity = {
  code: "C2.MAZ.02",
  strand_code: "C2.MAZ",
  competency_code: "C2",
  name: "Mê cung nhiều nhánh",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "deduce"],
  tier: "advanced",
  prerequisites: ["C2.MAZ.01"],
  learning_objectives: [
    {
      code: "LO-C2.MAZ.02-01",
      behaviour: "Nhận biết và thực hành Mê cung nhiều nhánh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.MAZ.02-02",
      behaviour: "Vận dụng Mê cung nhiều nhánh trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.MAZ.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Mê cung nhiều nhánh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_MAZ_02_DATASET: SkillDataset = {
  skill_code: "C2.MAZ.02",
  concept_label: "Mê cung nhiều nhánh",
  surface: "game",
  items: [
    {
      id: "path_key",
      label: "chìa khóa vàng",
      image: {
        kind: "emoji",
        ref: "🔑",
      },
      category: {
        type: "lối đi đúng",
      },
      contrast_group: "correct_path",
      value: 1,
      ordering: 1,
    },
    {
      id: "path_light",
      label: "ngọn đèn soi đường",
      image: {
        kind: "emoji",
        ref: "🏮",
      },
      category: {
        type: "lối đi đúng",
      },
      contrast_group: "correct_path",
      value: 2,
      ordering: 2,
    },
    {
      id: "path_bridge",
      label: "chiếc cầu gỗ nhỏ",
      image: {
        kind: "emoji",
        ref: "🌉",
      },
      category: {
        type: "lối đi đúng",
      },
      contrast_group: "correct_path",
      value: 3,
      ordering: 3,
    },
    {
      id: "path_door",
      label: "cửa thoát hiểm mở",
      image: {
        kind: "emoji",
        ref: "🚪",
      },
      category: {
        type: "lối đi đúng",
      },
      contrast_group: "correct_path",
      value: 4,
      ordering: 4,
    },
    {
      id: "dead_spider",
      label: "mạng nhện giăng kín",
      image: {
        kind: "emoji",
        ref: "🕸️",
      },
      category: {
        type: "ngõ cụt",
      },
      contrast_group: "dead_end",
      value: 5,
      ordering: 5,
    },
    {
      id: "dead_wall",
      label: "bức tường gạch cụt",
      image: {
        kind: "emoji",
        ref: "🧱",
      },
      category: {
        type: "ngõ cụt",
      },
      contrast_group: "dead_end",
      value: 6,
      ordering: 6,
    },
    {
      id: "dead_fog",
      label: "đám mây mù mịt",
      image: {
        kind: "emoji",
        ref: "🌫️",
      },
      category: {
        type: "ngõ cụt",
      },
      contrast_group: "dead_end",
      value: 7,
      ordering: 7,
    },
    {
      id: "dead_pit",
      label: "hố sâu thăm thẳm",
      image: {
        kind: "emoji",
        ref: "🕳️",
      },
      category: {
        type: "ngõ cụt",
      },
      contrast_group: "dead_end",
      value: 8,
      ordering: 8,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "path_key",
      target_id: "dead_spider",
    },
    {
      type: "pair",
      source_id: "path_light",
      target_id: "dead_wall",
    },
    {
      type: "pair",
      source_id: "path_bridge",
      target_id: "dead_fog",
    },
    {
      type: "pair",
      source_id: "path_door",
      target_id: "dead_pit",
    },
    {
      type: "contrast",
      source_id: "path_key",
      target_id: "dead_spider",
    },
  ],
  axes: {
    category: {
      values: ["lối đi đúng", "ngõ cụt"],
    },
    order: {
      values: ["1", "2", "3", "4", "5", "6", "7", "8"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Mê cung nhiều nhánh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Mê cung nhiều nhánh",
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
    narration_template: "Chúng mình cùng tìm hiểu về Mê cung nhiều nhánh nhé",
  },
  ordering: [
    "path_key",
    "path_light",
    "path_bridge",
    "path_door",
    "dead_spider",
    "dead_wall",
    "dead_fog",
    "dead_pit",
  ],
};

export const C2_MAZ_02_SEED: SkillSeed = {
  identity: C2_MAZ_02_IDENTITY,
  dataset: C2_MAZ_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C2-MAZ-SORT-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-MAZ-HIDE-0001",
      template: "GT-015",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "school",
    },
    {
      template: "GT-007",
      band: "5-6",
      difficulty: 1,
      theme: "home",
    },
    {
      template: "GT-030",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
    {
      template: "GT-032",
      band: "5-6",
      difficulty: 2,
      theme: "school",
    },
  ],
};
